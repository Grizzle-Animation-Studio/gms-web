"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ENQUIRY ATTACHMENTS
// =============================================================================

export async function uploadEnquiryAttachment(formData: FormData) {
    try {
        const enquiryId = formData.get("enquiryId") as string;
        const file = formData.get("file") as File;

        if (!enquiryId || !file) {
            return { error: "Enquiry ID and file are required" };
        }

        // Validate file size (50MB limit)
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_SIZE) {
            return { error: "File size exceeds 50MB limit" };
        }

        // Save file to local storage
        const fs = require('fs').promises;
        const path = require('path');

        const uploadsDir = path.join(process.cwd(), 'uploads', 'enquiries');

        // Ensure uploads directory exists
        await fs.mkdir(uploadsDir, { recursive: true });

        // Read file as buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create attachment record first to get ID
        const attachment = await prisma.enquiryAttachment.create({
            data: {
                enquiryId,
                filename: file.name,
                fileSize: file.size,
                mimeType: file.type || null,
                dropboxPath: null, // TODO: Dropbox integration
            },
        });

        // Save file with attachment ID as filename
        const filePath = path.join(uploadsDir, attachment.id);
        await fs.writeFile(filePath, buffer);

        console.log(`✅ File saved: ${file.name} (${file.size} bytes) -> ${filePath}`);

        revalidatePath(`/enquiries/${enquiryId}`);
        return { success: true, attachment };
    } catch (error) {
        console.error("Failed to upload attachment:", error);
        return { error: "Failed to upload file" };
    }
}

export async function deleteEnquiryAttachment(attachmentId: string) {
    try {
        // Get attachment info to delete file from disk
        const attachment = await prisma.enquiryAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (attachment) {
            // Delete file from disk
            const fs = require('fs').promises;
            const path = require('path');
            const filePath = path.join(process.cwd(), 'uploads', 'enquiries', attachment.id);

            try {
                await fs.unlink(filePath);
                console.log(`✅ File deleted: ${filePath}`);
            } catch (err) {
                console.warn(`⚠️ Could not delete file: ${filePath}`, err);
            }
        }

        // Delete from database
        await prisma.enquiryAttachment.delete({
            where: { id: attachmentId },
        });

        revalidatePath("/enquiries");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete attachment:", error);
        return { error: "Failed to delete attachment" };
    }
}

export async function getAttachmentDownloadUrl(attachmentId: string) {
    try {
        const attachment = await prisma.enquiryAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment) {
            return { error: "Attachment not found" };
        }

        // Return API route URL
        return {
            url: `/api/enquiries/attachments/${attachmentId}`,
            filename: attachment.filename,
        };
    } catch (error) {
        console.error("Failed to get download URL:", error);
        return { error: "Failed to get download URL" };
    }
}

// =============================================================================
// ENQUIRY ACTIVITIES
// =============================================================================

export async function createEnquiryActivity(
    enquiryId: string,
    type: string,
    content: string,
    title?: string,
    meetingDate?: Date,
    attendees?: string[]
) {
    try {
        const activity = await prisma.enquiryActivity.create({
            data: {
                enquiryId,
                type,
                title: title || null,
                content,
                meetingDate: meetingDate || null,
                attendees: attendees ? JSON.stringify(attendees) : null,
            },
        });

        revalidatePath(`/enquiries/${enquiryId}`);
        return { success: true, activity };
    } catch (error) {
        console.error("Failed to create activity:", error);
        return { error: "Failed to create activity" };
    }
}

export async function deleteEnquiryActivity(activityId: string) {
    try {
        await prisma.enquiryActivity.delete({
            where: { id: activityId },
        });

        revalidatePath("/enquiries");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete activity:", error);
        return { error: "Failed to delete activity" };
    }
}
