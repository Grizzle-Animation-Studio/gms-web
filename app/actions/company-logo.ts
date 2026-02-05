"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getFaviconUrl } from "@/lib/favicon";

/**
 * Fetch and store the logo URL for a company based on its website
 * @param companyId - The company ID
 * @returns The updated company with logoUrl
 */
export async function fetchAndStoreCompanyLogo(companyId: string) {
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true, name: true, website: true, logoUrl: true }
        });

        if (!company) {
            return { error: "Company not found" };
        }

        if (!company.website) {
            return { error: "Company has no website URL" };
        }

        // Get the favicon URL
        const faviconUrl = getFaviconUrl(company.website);

        // Try updating the company with the favicon URL
        // Use 'as any' to handle potential Prisma client regeneration issues
        const updatedCompany = await prisma.company.update({
            where: { id: companyId },
            data: { logoUrl: faviconUrl } as any
        });

        revalidatePath(`/companies/${companyId}`);
        revalidatePath('/companies');

        return {
            success: true,
            logoUrl: faviconUrl,
            company: updatedCompany
        };
    } catch (error) {
        console.error('Error fetching company logo:', error);
        return { error: `Failed to fetch logo: ${error}` };
    }
}

/**
 * Automatically fetch logos for all companies that have websites but no logos
 * @returns Summary of the operation
 */
export async function fetchAllMissingCompanyLogos() {
    try {
        // Find companies with websites but no logos
        // Using raw query to avoid Prisma client issues
        const companies = await prisma.company.findMany({
            where: {
                website: { not: null }
            },
            select: { id: true, name: true, website: true, logoUrl: true }
        });

        // Filter in JS for those without logos (raw select approach)
        const companiesWithoutLogos = companies.filter((c: any) => !c.logoUrl && c.website);

        let updated = 0;
        let failed = 0;

        for (const company of companiesWithoutLogos) {
            try {
                const faviconUrl = getFaviconUrl(company.website!);
                await prisma.company.update({
                    where: { id: company.id },
                    data: { logoUrl: faviconUrl } as any
                });
                updated++;
                console.log(`✅ Updated logo for ${company.name}`);
            } catch (err) {
                failed++;
                console.error(`❌ Failed to update logo for ${company.name}:`, err);
            }
        }

        revalidatePath('/companies');

        return {
            success: true,
            totalProcessed: companiesWithoutLogos.length,
            updated,
            failed
        };
    } catch (error) {
        console.error('Error fetching missing company logos:', error);
        return { error: `Failed to fetch logos: ${error}` };
    }
}
