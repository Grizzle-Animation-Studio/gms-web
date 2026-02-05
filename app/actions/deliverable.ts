"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface DeliverableData {
    name: string;
    frameRate?: string | null;
    width?: number | null;
    height?: number | null;
    aspectRatio?: string | null;
    duration?: string | null;
}

export async function createDeliverable(projectId: string, data: DeliverableData) {
    try {
        const deliverable = await prisma.deliverable.create({
            data: {
                projectId,
                name: data.name || 'Untitled Deliverable',
                frameRate: data.frameRate || null,
                width: data.width || null,
                height: data.height || null,
                aspectRatio: data.aspectRatio || null,
                duration: data.duration || null,
            }
        });

        revalidatePath(`/projects/${projectId}`);
        return { success: true, deliverable };
    } catch (error: any) {
        console.error("Failed to create deliverable:", error);
        return { error: error.message || "Failed to create deliverable" };
    }
}

export async function updateDeliverable(deliverableId: string, data: DeliverableData) {
    try {
        const deliverable = await prisma.deliverable.update({
            where: { id: deliverableId },
            data: {
                name: data.name,
                frameRate: data.frameRate,
                width: data.width,
                height: data.height,
                aspectRatio: data.aspectRatio,
                duration: data.duration,
            }
        });

        revalidatePath(`/projects/${deliverable.projectId}`);
        return { success: true, deliverable };
    } catch (error: any) {
        console.error("Failed to update deliverable:", error);
        return { error: error.message || "Failed to update deliverable" };
    }
}

export async function deleteDeliverable(deliverableId: string) {
    try {
        const deliverable = await prisma.deliverable.delete({
            where: { id: deliverableId }
        });

        revalidatePath(`/projects/${deliverable.projectId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete deliverable:", error);
        return { error: error.message || "Failed to delete deliverable" };
    }
}
