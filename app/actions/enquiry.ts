"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface DeliverableInput {
    name?: string;
    frameRate?: string;
    aspectRatio?: string;
    width?: string;
    height?: string;
    duration?: string;
    description?: string;
}

export async function createEnquiry(
    rawContent: string,
    companyId?: string,
    contactId?: string,
    projectTitle?: string,
    projectSummary?: string,
    projectDescription?: string,
    budget?: string,
    budgetMin?: string,
    budgetMax?: string,
    timeline?: string,
    companyName?: string,  // For auto-creating company if not exists
    companyWebsite?: string, // Inferred website URL
    // NEW: Job details fields
    framerate?: string,  // DEPRECATED - use deliverables array
    aspectRatio?: string,  // DEPRECATED - use deliverables array
    tone?: string,
    referenceLinks?: string,  // JSON string array
    numberOfDeliverables?: number,  // DEPRECATED - use deliverables.length
    deliverables?: DeliverableInput[]  // NEW: Array of deliverables
) {
    console.log('🔧 createEnquiry called with:', { companyId, contactId, projectTitle });

    if (!rawContent || rawContent.trim() === "") {
        return { error: "Content cannot be empty" };
    }

    try {
        // NEW: Auto-create company if name provided but no ID
        let finalCompanyId = companyId;
        if (!finalCompanyId && companyName && companyName.trim()) {
            console.log('🏢 Auto-creating company:', companyName);

            // Check if company already exists (case-insensitive) 
            // SQLite doesn't support mode: 'insensitive', so we fetch all and compare in JS
            const allCompanies = await prisma.company.findMany({
                select: { id: true, name: true },
            });

            const normalizedSearchName = companyName.trim().toLowerCase();
            const existingCompany = allCompanies.find(
                c => c.name.toLowerCase() === normalizedSearchName
            );

            if (existingCompany) {
                console.log('✅ Found existing company:', existingCompany.name);
                finalCompanyId = existingCompany.id;
                // Update website if not already set and we have one
                if (companyWebsite && companyWebsite.trim()) {
                    try {
                        const companyRecord = await prisma.company.findUnique({
                            where: { id: existingCompany.id },
                            select: { website: true } as any
                        });
                        if (!companyRecord?.website) {
                            await prisma.company.update({
                                where: { id: existingCompany.id },
                                data: { website: companyWebsite.trim() } as any
                            });
                            console.log('🌐 Updated company website:', companyWebsite);
                        }
                    } catch (websiteError) {
                        // Prisma client may not be regenerated yet with website field
                        console.log('⚠️ Could not update website (regenerate Prisma client):', websiteError);
                    }
                }
            } else {
                // Create new company - use dynamic data to handle missing website field
                const companyData: any = {
                    name: companyName.trim(),
                };

                // Only add website if Prisma client supports it
                try {
                    if (companyWebsite?.trim()) {
                        companyData.website = companyWebsite.trim();
                    }
                } catch (e) {
                    // Ignore - website field may not exist yet
                }

                const newCompany = await prisma.company.create({
                    data: companyData,
                });
                console.log('✨ Created new company:', newCompany.name, 'with website:', companyData.website || 'none');
                finalCompanyId = newCompany.id;
            }
        }

        // Validate company exists if provided
        if (finalCompanyId) {
            const company = await prisma.company.findUnique({
                where: { id: finalCompanyId },
            });
            if (!company) {
                return { error: "Selected company not found" };
            }
        }

        // Validate contact exists if provided
        if (contactId) {
            const contact = await prisma.contactClientSide.findUnique({
                where: { id: contactId },
            });
            if (!contact) {
                return { error: "Selected contact not found" };
            }
        }

        const enquiry = await prisma.enquiry.create({
            data: {
                rawContent,
                status: "PENDING",
                companyId: finalCompanyId || null,
                contactId: contactId || null,
                projectTitle: projectTitle || null,
                projectSummary: projectSummary || null,
                projectDescription: projectDescription || null,
                budget: budget || null,
                budgetMin: budgetMin || null,
                budgetMax: budgetMax || null,
                timeline: timeline || null,
                // LEGACY: Job details (kept for backward compatibility)
                framerate: framerate || null,
                aspectRatio: aspectRatio || null,
                tone: tone || null,
                referenceLinks: referenceLinks || null,
                numberOfDeliverables: numberOfDeliverables || deliverables?.length || null,
                // NEW: Create deliverables if provided
                deliverables: deliverables && deliverables.length > 0 ? {
                    create: deliverables.map(del => ({
                        name: del.name || null,
                        frameRate: del.frameRate || null,
                        aspectRatio: del.aspectRatio || null,
                        width: del.width ? parseInt(del.width) : null,
                        height: del.height ? parseInt(del.height) : null,
                        duration: del.duration || null,
                        description: del.description || null,
                    }))
                } : undefined
            },
        });

        console.log('✅ Enquiry created:', enquiry.id);
        if (deliverables && deliverables.length > 0) {
            console.log(`📋 Created ${deliverables.length} deliverable(s)`);
        }


        revalidatePath("/enquiries");
        return { success: true, enquiry };
    } catch (error) {
        console.error("Failed to create enquiry:", error);
        return { error: "Failed to create enquiry" };
    }
}

export async function updateEnquiry(enquiryId: string, data: {
    rawContent?: string;
    companyId?: string | null;
}) {
    try {
        // Validate company exists if provided
        if (data.companyId) {
            const company = await prisma.company.findUnique({
                where: { id: data.companyId },
            });
            if (!company) {
                return { error: "Selected company not found" };
            }
        }

        const enquiry = await prisma.enquiry.update({
            where: { id: enquiryId },
            data: {
                rawContent: data.rawContent,
                companyId: data.companyId === null ? null : data.companyId,
            },
        });

        revalidatePath("/enquiries");
        return { success: true, enquiry };
    } catch (error) {
        console.error("Failed to update enquiry:", error);
        return { error: "Failed to update enquiry" };
    }
}

export async function getEnquiries() {
    try {
        // In a real app we'd paginate this
        const enquiries = await prisma.enquiry.findMany({
            where: {
                status: {
                    not: "ARCHIVED",
                },
            },
            orderBy: { receivedAt: "desc" },
            include: {
                company: true,
                project: true,
                contact: true,
                deliverables: {
                    orderBy: { createdAt: "asc" }
                }
            },
        });

        // Map database fields to component-expected fields
        return enquiries.map(enquiry => ({
            ...enquiry,
            title: enquiry.projectTitle,
            description: enquiry.projectDescription || enquiry.rawContent.substring(0, 200),
        }));
    } catch (error) {
        console.error("Failed to fetch enquiries:", error);
        return [];
    }
}

export async function deleteEnquiry(enquiryId: string) {
    try {
        // Check if enquiry has been converted to a project
        const enquiry = await prisma.enquiry.findUnique({
            where: { id: enquiryId },
            include: { project: true },
        });

        if (!enquiry) {
            return { error: "Enquiry not found" };
        }

        if (enquiry.project) {
            return { error: "Cannot delete enquiry that has been converted to a project. Archive it instead." };
        }

        await prisma.enquiry.delete({
            where: { id: enquiryId },
        });

        console.log('✅ Enquiry deleted:', enquiry.id);

        revalidatePath("/enquiries");
        return { success: true, enquiry };
    } catch (error) {
        console.error("Failed to delete enquiry:", error);
        return { error: "Failed to delete enquiry" };
    }
}

export async function archiveEnquiry(enquiryId: string) {
    try {
        await prisma.enquiry.update({
            where: { id: enquiryId },
            data: { status: "ARCHIVED" },
        });

        revalidatePath("/enquiries");
        return { success: true };
    } catch (error) {
        console.error("Failed to archive enquiry:", error);
        return { error: "Failed to archive enquiry" };
    }
}

export async function parseEnquiryWithAI(rawContent: string) {
    try {
        const { parseEnquiryWithLLM } = await import("@/lib/llm");

        // Call LLM to parse the enquiry
        const parsed = await parseEnquiryWithLLM(rawContent);

        // Try to find matching companies with better fuzzy matching
        const potentialCompanies = await prisma.company.findMany({
            where: {
                OR: [
                    { name: { contains: parsed.clientName } },
                    { name: { contains: parsed.clientName.split(' ')[0] } }, // First word match
                    { name: { contains: parsed.clientName.split(' ').slice(0, 2).join(' ') } }, // First two words
                ],
            },
            include: {
                contactsClientSide: true  // Include existing contacts for matching
            },
            take: 10,
        });

        // Score each company match
        const calculateCompanyScore = (company: any, searchName: string): number => {
            const companyLower = company.name.toLowerCase();
            const searchLower = searchName.toLowerCase();

            // Exact match
            if (companyLower === searchLower) return 1.0;

            // Contains full search term
            if (companyLower.includes(searchLower)) return 0.9;

            // Search term contains company name (e.g., "Red Bull Creative" contains "Red Bull")
            if (searchLower.includes(companyLower)) return 0.85;

            // Extract keywords and check overlap
            const companyWords = companyLower.split(/\s+/).filter((w: string) => w.length > 2);
            const searchWords = searchLower.split(/\s+/).filter((w: string) => w.length > 2);
            const commonWords = companyWords.filter((w: string) => searchWords.includes(w));

            if (commonWords.length === 0) return 0;

            const overlapRatio = commonWords.length / Math.max(companyWords.length, searchWords.length);
            return 0.5 + (overlapRatio * 0.3); // 0.5-0.8 range
        };

        const companyCandidates = potentialCompanies.map(company => ({
            id: company.id,
            name: company.name,
            companyEmail: company.companyEmail,
            matchScore: calculateCompanyScore(company, parsed.clientName),
            existingContacts: company.contactsClientSide.length,
        })).filter(c => c.matchScore > 0.4) // Only keep reasonable matches
            .sort((a, b) => b.matchScore - a.matchScore) // Best match first
            .slice(0, 5); // Top 5 candidates

        console.log(`Found ${companyCandidates.length} company candidates for "${parsed.clientName}"`);
        companyCandidates.forEach(c =>
            console.log(`  - ${c.name} (score: ${c.matchScore.toFixed(2)}, ${c.existingContacts} contacts)`)
        );

        // Return candidates for UI selection
        revalidatePath("/companies");
        revalidatePath("/enquiries");

        return {
            success: true,
            parsed,
            companyCandidates,
            // For backward compatibility and simple cases
            suggestedCompany: companyCandidates.length > 0 ? companyCandidates[0] : null,
        };
    } catch (error: any) {
        console.error("[parseEnquiryWithAI] Error:", error);
        return {
            success: false,
            error: error.message || "Failed to parse enquiry",
        };
    }
}
