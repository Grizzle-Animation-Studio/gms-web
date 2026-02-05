"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// =============================================================================
// CHECKLIST TEMPLATE ACTIONS
// =============================================================================

export async function getChecklistTemplates() {
    return prisma.checklistTemplate.findMany({
        include: {
            items: {
                orderBy: { sortOrder: "asc" }
            }
        },
        orderBy: { name: "asc" }
    });
}

export async function getChecklistTemplate(id: string) {
    return prisma.checklistTemplate.findUnique({
        where: { id },
        include: {
            items: {
                orderBy: { sortOrder: "asc" }
            }
        }
    });
}

export async function createChecklistTemplate(
    name: string,
    description?: string,
    isDefault?: boolean
) {
    // If marking as default, unset other defaults
    if (isDefault) {
        await prisma.checklistTemplate.updateMany({
            where: { isDefault: true },
            data: { isDefault: false }
        });
    }

    const template = await prisma.checklistTemplate.create({
        data: {
            name,
            description,
            isDefault: isDefault || false
        }
    });

    revalidatePath("/settings");
    return template;
}

export async function updateChecklistTemplate(
    id: string,
    data: { name?: string; description?: string; isDefault?: boolean }
) {
    // If marking as default, unset other defaults
    if (data.isDefault) {
        await prisma.checklistTemplate.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false }
        });
    }

    const template = await prisma.checklistTemplate.update({
        where: { id },
        data
    });

    revalidatePath("/settings");
    return template;
}

export async function deleteChecklistTemplate(id: string) {
    await prisma.checklistTemplate.delete({
        where: { id }
    });

    revalidatePath("/settings");
    return { success: true };
}

// =============================================================================
// CHECKLIST TEMPLATE ITEM ACTIONS
// =============================================================================

export async function addTemplateItem(
    templateId: string,
    title: string,
    description?: string,
    required?: boolean,
    defaultOwner?: string
) {
    // Get max sortOrder for this template
    const maxOrder = await prisma.checklistTemplateItem.aggregate({
        where: { templateId },
        _max: { sortOrder: true }
    });

    const item = await prisma.checklistTemplateItem.create({
        data: {
            templateId,
            title,
            description,
            required: required ?? true,
            defaultOwner: defaultOwner || "grizzle",
            sortOrder: (maxOrder._max.sortOrder || 0) + 1
        }
    });

    revalidatePath("/settings");
    return item;
}

export async function updateTemplateItem(
    id: string,
    data: {
        title?: string;
        description?: string;
        required?: boolean;
        defaultOwner?: string;
        sortOrder?: number;
    }
) {
    const item = await prisma.checklistTemplateItem.update({
        where: { id },
        data
    });

    revalidatePath("/settings");
    return item;
}

export async function deleteTemplateItem(id: string) {
    await prisma.checklistTemplateItem.delete({
        where: { id }
    });

    revalidatePath("/settings");
    return { success: true };
}

// =============================================================================
// PROJECT CHECKLIST ACTIONS
// =============================================================================

/**
 * Initialize checklist for a project from a template
 */
export async function initializeProjectChecklist(projectId: string, templateId?: string) {
    // Get template (use default if not specified)
    const template = templateId
        ? await prisma.checklistTemplate.findUnique({
            where: { id: templateId },
            include: { items: { orderBy: { sortOrder: "asc" } } }
        })
        : await prisma.checklistTemplate.findFirst({
            where: { isDefault: true },
            include: { items: { orderBy: { sortOrder: "asc" } } }
        });

    if (!template) {
        return { error: "No template found" };
    }

    // Delete existing checklist items for this project
    await prisma.checklistItem.deleteMany({
        where: { projectId }
    });

    // Create new items from template
    const items = await Promise.all(
        template.items.map(item =>
            prisma.checklistItem.create({
                data: {
                    projectId,
                    title: item.title,
                    description: item.description,
                    required: item.required,
                    owner: item.defaultOwner,
                    sortOrder: item.sortOrder,
                    status: "missing"
                }
            })
        )
    );

    revalidatePath(`/projects/${projectId}`);
    return { success: true, items };
}

/**
 * Get all checklist items for a project
 */
export async function getProjectChecklist(projectId: string) {
    return prisma.checklistItem.findMany({
        where: { projectId },
        orderBy: { sortOrder: "asc" }
    });
}

/**
 * Update a checklist item's status
 */
export async function updateChecklistItemStatus(
    itemId: string,
    status: "missing" | "in_progress" | "done" | "waived",
    completedBy?: string,
    waivedReason?: string
) {
    const updateData: Record<string, unknown> = {
        status,
        updatedAt: new Date()
    };

    if (status === "done") {
        updateData.completedAt = new Date();
        updateData.completedBy = completedBy || "Unknown";
    } else if (status === "waived") {
        updateData.waivedReason = waivedReason || "No reason provided";
        updateData.completedAt = new Date();
        updateData.completedBy = completedBy || "Unknown";
    } else {
        updateData.completedAt = null;
        updateData.completedBy = null;
        updateData.waivedReason = null;
    }

    const item = await prisma.checklistItem.update({
        where: { id: itemId },
        data: updateData
    });

    // Revalidate project page
    const fullItem = await prisma.checklistItem.findUnique({
        where: { id: itemId }
    });
    if (fullItem) {
        revalidatePath(`/projects/${fullItem.projectId}`);
    }

    return item;
}

/**
 * Update checklist item details
 */
export async function updateChecklistItem(
    itemId: string,
    data: {
        title?: string;
        description?: string;
        owner?: string;
        dueDate?: Date | null;
        evidenceUrl?: string;
    }
) {
    const item = await prisma.checklistItem.update({
        where: { id: itemId },
        data
    });

    revalidatePath(`/projects/${item.projectId}`);
    return item;
}

/**
 * Add a custom checklist item to a project
 */
export async function addCustomChecklistItem(
    projectId: string,
    title: string,
    description?: string,
    required?: boolean,
    owner?: string
) {
    const maxOrder = await prisma.checklistItem.aggregate({
        where: { projectId },
        _max: { sortOrder: true }
    });

    const item = await prisma.checklistItem.create({
        data: {
            projectId,
            title,
            description,
            required: required ?? true,
            owner: owner || "grizzle",
            sortOrder: (maxOrder._max.sortOrder || 0) + 1,
            status: "missing"
        }
    });

    revalidatePath(`/projects/${projectId}`);
    return item;
}

/**
 * Check if project can start production (all required items done or waived)
 */
export async function canStartProduction(projectId: string): Promise<{
    canStart: boolean;
    requiredItems: number;
    completedItems: number;
    pendingItems: { id: string; title: string; status: string }[];
}> {
    const items = await prisma.checklistItem.findMany({
        where: { projectId, required: true },
        select: { id: true, title: true, status: true }
    });

    const completedItems = items.filter(
        item => item.status === "done" || item.status === "waived"
    );
    const pendingItems = items.filter(
        item => item.status !== "done" && item.status !== "waived"
    );

    return {
        canStart: pendingItems.length === 0,
        requiredItems: items.length,
        completedItems: completedItems.length,
        pendingItems
    };
}
