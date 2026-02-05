"use server";

import { prisma } from "@/lib/db";

export async function getEnquiry(id: string) {
    try {
        const enquiry = await prisma.enquiry.findUnique({
            where: { id },
            include: {
                company: true,
                contact: true,
                project: true,
                attachments: {
                    orderBy: { uploadedAt: 'desc' },
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                },
                deliverables: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!enquiry) {
            return null;
        }

        return enquiry;
    } catch (error) {
        console.error("Failed to fetch enquiry:", error);
        return null;
    }
}
