/**
 * Dropbox Utility Functions for Enquiry Attachment Management
 * 
 * This file extends the existing Dropbox integration with functions for:
 * - Creating temporary enquiry folders
 * - Uploading attachments to enquiry folders
 * - Determining file destination folders based on file type
 * - Moving attachments from enquiry to production project folders
 */

import { Dropbox } from "dropbox";
import { prisma } from "@/lib/db";

/**
 * Create a temporary folder for enquiry attachments
 * Path format: /Data - Grizzle/Enquiry data/[EnquiryID]-[Company]-[Project_Title]
 */
export async function createEnquiryFolder(
    enquiryId: string,
    companyName: string,
    projectTitle: string
): Promise<{ success: boolean; path?: string; error?: string }> {
    // Sanitize folder name components
    const safeCompany = companyName.replace(/[\/\\:*?"<>|]/g, "");
    const safeTitle = projectTitle.replace(/[\/\\:*?"<>|]/g, "");
    const folderName = `${enquiryId}-${safeCompany}-${safeTitle}`;

    const enquiryDataPath = "/Data - Grizzle/Enquiry data";
    const fullPath = `${enquiryDataPath}/${folderName}`;

    if (!process.env.DROPBOX_REFRESH_TOKEN && !process.env.DROPBOX_ACCESS_TOKEN) {
        console.warn("[Dropbox] No credentials found for enquiry folder creation");
        return {
            success: false,
            error: "Dropbox credentials not configured"
        };
    }

    try {
        const dbx = new Dropbox({
            clientId: process.env.DROPBOX_APP_KEY,
            clientSecret: process.env.DROPBOX_APP_SECRET,
            refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
            accessToken: process.env.DROPBOX_ACCESS_TOKEN,
            fetch: fetch
        });

        const response = await dbx.filesCreateFolderV2({ path: fullPath });
        console.log(`[Dropbox] Created enquiry folder: ${response.result.metadata.path_display}`);

        return {
            success: true,
            path: response.result.metadata.path_display
        };
    } catch (error: any) {
        // Folder might already exist
        if (error?.error?.error?.['.tag'] === 'path' && error?.error?.error?.path?.['.tag'] === 'conflict') {
            console.log(`[Dropbox] Enquiry folder already exists: ${fullPath}`);
            return {
                success: true,
                path: fullPath
            };
        }

        console.error("[Dropbox] Error creating enquiry folder:", error);
        return {
            success: false,
            error: error.message || "Failed to create enquiry folder"
        };
    }
}

/**
 * Upload a file to the enquiry's temporary Dropbox folder
 */
export async function uploadEnquiryAttachment(
    enquiryPath: string,
    file: File
): Promise<{ success: boolean; dropboxPath?: string; error?: string }> {
    if (!process.env.DROPBOX_REFRESH_TOKEN && !process.env.DROPBOX_ACCESS_TOKEN) {
        return {
            success: false,
            error: "Dropbox credentials not configured"
        };
    }

    try {
        const dbx = new Dropbox({
            clientId: process.env.DROPBOX_APP_KEY,
            clientSecret: process.env.DROPBOX_APP_SECRET,
            refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
            accessToken: process.env.DROPBOX_ACCESS_TOKEN,
            fetch: fetch
        });

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const filePath = `${enquiryPath}/${file.name}`;

        const response = await dbx.filesUpload({
            path: filePath,
            contents: fileBuffer,
            mode: { '.tag': 'add' },
            autorename: true
        });

        console.log(`[Dropbox] Uploaded enquiry attachment: ${response.result.path_display}`);

        return {
            success: true,
            dropboxPath: response.result.path_display
        };
    } catch (error: any) {
        console.error("[Dropbox] Error uploading enquiry attachment:", error);
        return {
            success: false,
            error: error.message || "Failed to upload attachment"
        };
    }
}

/**
 * Determine the destination folder for a file based on its extension
 */
export function getFileDestinationFolder(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';

    const folderMap: Record<string, string> = {
        // Documents → Brief
        'pdf': 'Brief',
        'doc': 'Brief',
        'docx': 'Brief',
        'txt': 'Brief',

        // Images → Ref
        'jpg': 'Ref',
        'jpeg': 'Ref',
        'png': 'Ref',
        'gif': 'Ref',
        'webp': 'Ref',
        'svg': 'Ref',

        // Videos → Footage
        'mp4': 'Footage',
        'mov': 'Footage',
        'avi': 'Footage',
        'mkv': 'Footage',
        'wmv': 'Footage',

        // After Effects → AE
        'aep': 'AE',
        'aet': 'AE',

        // Cinema 4D → C4D
        'c4d': 'C4D',
    };

    return folderMap[ext] || 'Assets';
}

/**
 * Move attachments from local enquiry folder to production project folder in Dropbox
 * Files are read from local storage and uploaded to the appropriate Dropbox subfolder
 */
export async function moveAttachmentsToProduction(
    enquiryId: string,
    projectDropboxPath: string
): Promise<{ success: boolean; movedCount?: number; errors?: string[] }> {
    console.log(`📦 Moving attachments for enquiry ${enquiryId} to ${projectDropboxPath}`);

    if (!process.env.DROPBOX_REFRESH_TOKEN && !process.env.DROPBOX_ACCESS_TOKEN) {
        console.warn("[Dropbox] No credentials found.");
        return {
            success: false,
            errors: ["Dropbox credentials not configured"]
        };
    }

    // Import fs for reading local files
    const fs = require('fs').promises;
    const path = require('path');

    try {
        const dbx = new Dropbox({
            clientId: process.env.DROPBOX_APP_KEY,
            clientSecret: process.env.DROPBOX_APP_SECRET,
            refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
            accessToken: process.env.DROPBOX_ACCESS_TOKEN,
            fetch: fetch
        });

        // Get all attachments for this enquiry (including those without dropboxPath)
        const attachments = await prisma.enquiryAttachment.findMany({
            where: {
                enquiryId: enquiryId,
                movedToProduction: false
            }
        });

        console.log(`📎 Found ${attachments.length} attachment(s) to upload`);

        if (attachments.length === 0) {
            console.log(`[Dropbox] No attachments to move for enquiry ${enquiryId}`);
            return { success: true, movedCount: 0 };
        }

        const errors: string[] = [];
        let movedCount = 0;

        for (const attachment of attachments) {
            try {
                // Determine destination folder based on file type
                const destinationFolder = getFileDestinationFolder(attachment.filename);
                const destinationPath = `${projectDropboxPath}/${destinationFolder}/${attachment.filename}`;

                console.log(`📂 Uploading ${attachment.filename} to ${destinationPath}`);

                // Read file from local storage
                const localFilePath = path.join(process.cwd(), 'uploads', 'enquiries', attachment.id);

                let fileBuffer: Buffer;
                try {
                    fileBuffer = await fs.readFile(localFilePath);
                } catch (readError: any) {
                    console.error(`❌ Could not read local file: ${localFilePath}`, readError.message);
                    errors.push(`Could not read ${attachment.filename}: ${readError.message}`);
                    continue;
                }

                // Upload to Dropbox
                await dbx.filesUpload({
                    path: destinationPath,
                    contents: fileBuffer,
                    mode: { '.tag': 'add' },
                    autorename: true
                });

                // Update database record
                await prisma.enquiryAttachment.update({
                    where: { id: attachment.id },
                    data: {
                        movedToProduction: true,
                        productionPath: destinationPath,
                        dropboxPath: destinationPath
                    }
                });

                movedCount++;
                console.log(`✅ Uploaded ${attachment.filename} to ${destinationFolder}/`);

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error: any) {
                const errorMsg = `Failed to upload ${attachment.filename}: ${error.message}`;
                errors.push(errorMsg);
                console.error(`❌ ${errorMsg}`);
            }
        }

        console.log(`🎉 Uploaded ${movedCount}/${attachments.length} attachment(s) to Dropbox`);

        return {
            success: errors.length === 0,
            movedCount,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error: any) {
        console.error("[Dropbox] Error uploading attachments to production:", error);
        return {
            success: false,
            errors: [error.message || "Failed to upload attachments"]
        };
    }
}
