"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createClient(data: {
    name: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    abn?: string;
}) {
    try {
        const client = await prisma.client.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                street: data.street,
                city: data.city,
                state: data.state,
                postcode: data.postcode,
                abn: data.abn,
            },
        });

        revalidatePath("/clients");
        return { success: true, client };
    } catch (error: any) {
        console.error("Failed to create client:", error);
        return { error: `Failed to create client: ${error.message || "Unknown error"}` };
    }
}

export async function updateClient(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    abn?: string;
}) {
    try {
        const client = await prisma.client.update({
            where: { id },
            data,
        });

        revalidatePath("/clients");
        revalidatePath(`/clients/${id}`);
        return { success: true, client };
    } catch (error: any) {
        console.error("Failed to update client:", error);
        return { error: `Failed to update client: ${error.message || "Unknown error"}` };
    }
}

export async function deleteClient(id: string) {
    try {
        // Check if client has any projects
        const client = await prisma.client.findUnique({
            where: { id },
            include: { projects: true },
        });

        if (!client) {
            return { error: "Client not found" };
        }

        if (client.projects.length > 0) {
            return { error: `Cannot delete client with ${client.projects.length} active project(s)` };
        }

        await prisma.client.delete({
            where: { id },
        });

        revalidatePath("/clients");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete client:", error);
        return { error: `Failed to delete client: ${error.message || "Unknown error"}` };
    }
}

export async function searchClients(query: string) {
    try {
        const clients = await prisma.client.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } },
                ],
            },
            orderBy: { name: "asc" },
        });

        return { success: true, clients };
    } catch (error: any) {
        console.error("Failed to search clients:", error);
        return { error: `Failed to search clients: ${error.message || "Unknown error"}` };
    }
}

export async function getAllClients() {
    try {
        const clients = await prisma.client.findMany({
            include: {
                _count: {
                    select: { projects: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return { success: true, clients };
    } catch (error: any) {
        console.error("Failed to get clients:", error);
        return { error: `Failed to get clients: ${error.message || "Unknown error"}` };
    }
}
