"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCompany(data: {
    name: string;
    companyEmail?: string;
    companyPhone?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    abn?: string;
}) {
    try {
        const company = await prisma.company.create({
            data: {
                name: data.name,
                companyEmail: data.companyEmail,
                companyPhone: data.companyPhone,
                street: data.street,
                city: data.city,
                state: data.state,
                postcode: data.postcode,
                abn: data.abn,
            },
        });

        revalidatePath("/companies");
        return { success: true, company };
    } catch (error: any) {
        console.error("Failed to create company:", error);
        return { error: `Failed to create company: ${error.message || "Unknown error"}` };
    }
}

export async function updateCompany(id: string, data: {
    name?: string;
    companyEmail?: string;
    companyPhone?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    abn?: string;
}) {
    try {
        const company = await prisma.company.update({
            where: { id },
            data,
        });

        revalidatePath("/companies");
        revalidatePath(`/companies/${id}`);
        return { success: true, company };
    } catch (error: any) {
        console.error("Failed to update company:", error);
        return { error: `Failed to update company: ${error.message || "Unknown error"}` };
    }
}

export async function deleteCompany(id: string) {
    try {
        // Check if company has any projects
        const company = await prisma.company.findUnique({
            where: { id },
            include: { projects: true },
        });

        if (!company) {
            return { error: "Company not found" };
        }

        if (company.projects.length > 0) {
            return { error: `Cannot delete company with ${company.projects.length} active project(s)` };
        }

        await prisma.company.delete({
            where: { id },
        });

        revalidatePath("/companies");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete company:", error);
        return { error: `Failed to delete company: ${error.message || "Unknown error"}` };
    }
}

export async function searchCompanies(query: string) {
    try {
        const companies = await prisma.company.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { companyEmail: { contains: query } },
                ],
            },
            orderBy: { name: "asc" },
        });

        return { success: true, companies };
    } catch (error: any) {
        console.error("Failed to search companies:", error);
        return { error: `Failed to search companies: ${error.message || "Unknown error"}` };
    }
}

export async function getCompanyById(id: string) {
    try {
        const company = await prisma.company.findUnique({
            where: { id },
        });

        if (!company) {
            return { error: "Company not found" };
        }

        return { success: true, company };
    } catch (error: any) {
        console.error("Failed to get company:", error);
        return { error: `Failed to get company: ${error.message || "Unknown error"}` };
    }
}

export async function getAllCompanies() {
    try {
        const companies = await prisma.company.findMany({
            include: {
                _count: {
                    select: { projects: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return { success: true, companies };
    } catch (error: any) {
        console.error("Failed to get companies:", error);
        return { error: `Failed to get companies: ${error.message || "Unknown error"}` };
    }
}
