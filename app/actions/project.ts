"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProjectFolder, createStandardFolderStructure, uploadReferenceLinks } from "@/lib/dropbox";
import { moveAttachmentsToProduction } from "@/lib/dropbox-enquiry";
import { initializeProjectChecklist } from "./checklist";

interface DeliverableInput {
    name: string;
    frameRate: string;
    width: string;
    height: string;
    aspectRatio: string;
    duration: string;
}

export async function createProjectFromEnquiry(
    enquiryId: string,
    companyId: string,
    projectTitle: string,
    contactId?: string,
    deliverables?: DeliverableInput[]
) {
    try {
        console.log('🔧 createProjectFromEnquiry called with:', {
            enquiryId,
            companyId,
            projectTitle,
            contactId
        });

        // Get enquiry details for reference links, budget, and deliverables
        const enquiry = await prisma.enquiry.findUnique({
            where: { id: enquiryId },
            select: {
                referenceLinks: true,
                budgetMin: true,
                budgetMax: true,
                budget: true,
                deliverables: true  // NEW: Fetch enquiry deliverables
            }
        });

        // Validate company exists
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            return { error: "Selected company not found" };
        }

        // Validate contact exists if provided
        if (contactId) {
            const contact = await prisma.contactClientSide.findUnique({
                where: { id: contactId },
            });

            if (!contact) {
                console.warn('⚠️ Contact not found:', contactId);
                // Don't fail, just proceed without contact
            } else {
                console.log('✅ Contact validated:', contact.firstName, contact.lastName);
            }
        }

        // Create Dropbox folder first
        console.log("📁 Creating Dropbox folder for project...");
        const dbxResult = await createProjectFolder(company.name, projectTitle);

        let dropboxPath = null;
        if (dbxResult.success && dbxResult.path) {
            dropboxPath = dbxResult.path;
            console.log("✅ Dropbox folder created:", dropboxPath);

            // Create standard folder structure
            console.log("📂 Creating standard folder structure...");
            await createStandardFolderStructure(dropboxPath);

            // Upload reference links if any exist
            if (enquiry?.referenceLinks) {
                try {
                    const links = JSON.parse(enquiry.referenceLinks);
                    if (Array.isArray(links) && links.length > 0) {
                        console.log(`🔗 Uploading ${links.length} reference links...`);
                        await uploadReferenceLinks(dropboxPath, links);
                    }
                } catch (error) {
                    console.error("Failed to parse/upload reference links:", error);
                    // Don't fail the whole conversion if reference links fail
                }
            }
        } else {
            console.warn("⚠️ Dropbox folder creation failed, continuing without it");
        }

        // Create Project
        const project = await prisma.project.create({
            data: {
                title: projectTitle,
                status: "PROPOSED",
                companyId: company.id,
                contactId: contactId || null,
                dropboxPath: dropboxPath,
                // Copy budget from enquiry
                budget: enquiry?.budget || null,
                budgetMin: enquiry?.budgetMin || null,
                budgetMax: enquiry?.budgetMax || null,
                enquiry: {
                    connect: { id: enquiryId },
                },
            },
        });

        console.log('✅ Project created:', project.id, 'with contact:', project.contactId || 'none');

        // Create deliverables - use enquiry deliverables if none manually provided
        const deliverablesSource = deliverables && deliverables.length > 0
            ? deliverables
            : enquiry?.deliverables || [];

        if (deliverablesSource.length > 0) {
            console.log(`📋 Creating ${deliverablesSource.length} deliverable(s)...`);

            for (const del of deliverablesSource) {
                await prisma.deliverable.create({
                    data: {
                        projectId: project.id,
                        name: del.name || 'Untitled Deliverable',
                        frameRate: del.frameRate || null,
                        width: typeof del.width === 'string' ? parseInt(del.width) : (del.width || null),
                        height: typeof del.height === 'string' ? parseInt(del.height) : (del.height || null),
                        aspectRatio: del.aspectRatio || null,
                        duration: del.duration || null,
                    }
                });
            }
            console.log(`✅ Created ${deliverablesSource.length} deliverable(s)`);
        }

        // Initialize project checklist from default template
        console.log('📋 Initializing project checklist...');
        try {
            await initializeProjectChecklist(project.id);
            console.log('✅ Project checklist initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize checklist:', error);
            // Don't fail the whole conversion if checklist init fails
        }

        // Move attachments from enquiry folder to production project folder
        if (dropboxPath) {
            try {
                console.log('📦 Moving enquiry attachments to production folder...');
                const moveResult = await moveAttachmentsToProduction(enquiryId, dropboxPath);

                if (moveResult.success) {
                    console.log(`✅ Moved ${moveResult.movedCount} attachment(s) to production`);
                } else {
                    console.error('⚠️ Some attachments failed to move:', moveResult.errors);
                    // Don't fail the whole conversion if attachment move fails
                }
            } catch (error) {
                console.error('⚠️ Error moving attachments:', error);
                // Don't fail the whole conversion
            }
        }

        // Update Enquiry Status
        await prisma.enquiry.update({
            where: { id: enquiryId },
            data: { status: "CONVERTED" },
        });

        revalidatePath("/projects");
        revalidatePath("/enquiries");
        return { success: true, projectId: project.id };
    } catch (error) {
        console.error("Failed to convert enquiry:", error);
        return { error: "Failed to convert enquiry" };
    }
}

export async function approveProject(projectId: string) {
    console.log("[APPROVE] Starting approval for project:", projectId);
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { company: true }
        });

        if (!project) {
            console.log("[APPROVE] Project not found:", projectId);
            return { error: "Project not found" };
        }
        console.log("[APPROVE] Found project:", project.title, "Company:", project.company.name);

        // 1. Trigger Dropbox creation
        console.log("[APPROVE] Calling createProjectFolder with:", project.company.name, project.title);
        const dbxResult = await createProjectFolder(project.company.name, project.title);
        console.log("[APPROVE] Dropbox result:", JSON.stringify(dbxResult, null, 2));

        let dropboxPath = null;
        if (dbxResult.success) {
            dropboxPath = dbxResult.path;
            console.log("[APPROVE] Dropbox SUCCESS - Path:", dropboxPath);
        } else {
            console.log("[APPROVE] Dropbox FAILED - Error:", dbxResult.error);
        }

        // 2. Update Project Status & Path
        console.log("[APPROVE] Updating project with dropboxPath:", dropboxPath);
        await prisma.project.update({
            where: { id: projectId },
            data: {
                status: "APPROVED",
                dropboxPath: dropboxPath || undefined
            }
        });
        console.log("[APPROVE] Project updated successfully");

        revalidatePath(`/projects/${projectId}`);
        const returnValue = { success: true, dropboxPath, debug: dbxResult.debug || dbxResult };
        console.log("[APPROVE] Returning:", JSON.stringify(returnValue, null, 2));
        return returnValue;
    } catch (error: any) {
        console.error("Failed to approve project:", error);
        return { error: `Failed to approve project: ${error.message || JSON.stringify(error)}` };
    }
}

export async function deleteProject(projectId: string) {
    try {
        await prisma.project.delete({
            where: { id: projectId }
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete project:", error);
        return { error: `Failed to delete project: ${error.message || "Unknown error"}` };
    }
}

export async function updateProjectCompany(projectId: string, companyId: string) {
    try {
        // Validate company exists
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            return { error: "Selected company not found" };
        }

        // Update project company
        await prisma.project.update({
            where: { id: projectId },
            data: { companyId: company.id },
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error("Failed to update project company:", error);
        return { error: "Failed to update project company" };
    }
}
