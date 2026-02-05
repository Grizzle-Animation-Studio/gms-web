/**
 * Server action to create or get a contact
 */
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createContact(data: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    companyId: string;
}) {
    try {
        const contact = await prisma.contactClientSide.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName || null,
                email: data.email || null,
                phone: data.phone || null,
                jobTitle: data.jobTitle || null,
                companyId: data.companyId,
            },
        });

        revalidatePath(`/companies/${data.companyId}`);
        return { success: true, contact };
    } catch (error) {
        console.error("Failed to create contact:", error);
        return { error: "Failed to create contact" };
    }
}

/**
 * Find or create a contact based on AI-extracted data
 */
export async function findOrCreateContact(
    companyId: string,
    contactData: {
        firstName: string;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
        jobTitle?: string | null;
    }
) {
    try {
        // Try to find existing contact
        const existing = await prisma.contactClientSide.findFirst({
            where: {
                companyId,
                firstName: contactData.firstName,
                lastName: contactData.lastName || undefined,
            },
        });

        if (existing) {
            return { success: true, contact: existing, created: false };
        }

        // Create new contact
        const contact = await prisma.contactClientSide.create({
            data: {
                firstName: contactData.firstName,
                lastName: contactData.lastName || null,
                email: contactData.email || null,
                phone: contactData.phone || null,
                jobTitle: contactData.jobTitle || null,
                companyId,
            },
        });

        return { success: true, contact, created: true };
    } catch (error) {
        console.error("Failed to find or create contact:", error);
        return { error: "Failed to find or create contact" };
    }
}

/**
 * Delete a contact
 */
export async function deleteContact(contactId: string) {
    try {
        await prisma.contactClientSide.delete({
            where: { id: contactId },
        });

        revalidatePath("/contacts");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete contact:", error);
        return { error: "Failed to delete contact" };
    }
}

/**
 * Bulk import contacts from CSV
 */
export async function importContacts(contacts: any[]) {
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Get all companies for matching
    const allCompanies = await prisma.company.findMany({
        select: { id: true, name: true },
    });

    const companyMap = new Map(
        allCompanies.map(c => [c.name.toLowerCase().trim(), c.id])
    );

    for (let i = 0; i < contacts.length; i++) {
        const row = contacts[i];

        try {
            // Validate required fields
            if (!row.firstName || !row.companyName) {
                errors.push(`Row ${i + 1}: Missing required fields (firstName or companyName)`);
                skipped++;
                continue;
            }

            // Find company
            const companyId = companyMap.get(row.companyName.toLowerCase().trim());
            if (!companyId) {
                errors.push(`Row ${i + 1}: Company "${row.companyName}" not found`);
                skipped++;
                continue;
            }

            // Check for duplicate
            const existing = await prisma.contactClientSide.findFirst({
                where: {
                    companyId,
                    firstName: row.firstName,
                    lastName: row.lastName || null,
                    email: row.email || undefined,
                },
            });

            if (existing) {
                errors.push(`Row ${i + 1}: Contact "${row.firstName} ${row.lastName || ''}" already exists`);
                skipped++;
                continue;
            }

            // Create contact
            await prisma.contactClientSide.create({
                data: {
                    firstName: row.firstName.trim(),
                    lastName: row.lastName?.trim() || null,
                    email: row.email?.trim() || null,
                    phone: row.phone?.trim() || null,
                    jobTitle: row.jobTitle?.trim() || null,
                    companyId,
                },
            });

            imported++;
        } catch (error) {
            console.error(`Error importing row ${i + 1}:`, error);
            errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            skipped++;
        }
    }

    revalidatePath("/contacts");

    return {
        success: imported > 0,
        imported,
        skipped,
        errors,
    };
}

