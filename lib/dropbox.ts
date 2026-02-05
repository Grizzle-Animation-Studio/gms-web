import { Dropbox } from "dropbox";

export async function createProjectFolder(clientName: string, projectTitle: string) {
    // Date formatting
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `${year}_${month}`;

    // Sanitize names (remove slashes, etc.)
    const safeClient = clientName.replace(/[\/\\:*?"<>|]/g, "");
    const safeTitle = projectTitle.replace(/[\/\\:*?"<>|]/g, "");

    // We'll use a relative root for now that looks correct.

    // For TESTING as requested:
    // "Client/Master System Test Client/YY_MM - Project Name"

    const rootDir = "/clients - grizzle"; // X:\Grizzle Dropbox\Tom Carpenter\ maps to Dropbox root /
    const folderName = `${prefix} - ${safeTitle}`;
    const fullPath = `${rootDir}/${safeClient}/${folderName}`;

    // Log to console for debugging
    console.error(`[Dropbox DEBUG] Attempting: ${fullPath} | Creds: ${!!process.env.DROPBOX_ACCESS_TOKEN}`);

    if (!process.env.DROPBOX_REFRESH_TOKEN && !process.env.DROPBOX_ACCESS_TOKEN) {
        console.warn("[Dropbox] No credentials found. returning mock path.");
        return {
            success: true,
            path: fullPath,
            mock: true,
            note: "Folder not actually created (missing creds)"
        };
    }

    try {
        const dbx = new Dropbox({
            clientId: process.env.DROPBOX_APP_KEY,
            clientSecret: process.env.DROPBOX_APP_SECRET,
            refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
            accessToken: process.env.DROPBOX_ACCESS_TOKEN,
            fetch: fetch // CRITICAL: Next.js server actions need explicit fetch
        });

        const response = await dbx.filesCreateFolderV2({ path: fullPath });
        console.error(`[Dropbox DEBUG] Success: ${JSON.stringify(response.result)}`);
        return {
            success: true,
            path: response.result.metadata.path_display,
            debug: response.result
        };
    } catch (error: any) {
        console.error(`[Dropbox DEBUG] Error: ${JSON.stringify(error)}`);

        if (error?.status === 409) {
            // Folder exists, acceptable.
            console.log("[Dropbox] Folder already exists.");
            return {
                success: true,
                path: fullPath,
                existing: true,
                debug: "Folder already exists (409)"
            };
        }
        console.error("[Dropbox] API Error:", error);
        return {
            success: false,
            error: error.message || "Unknown error",
            debug: error
        };
    }
}

/**
 * Standard project folder structure for video projects
 */
const STANDARD_FOLDERS = [
    '_Previews',
    'AE',
    'Assets',
    'Brief',
    'C4D',
    'Footage',
    'Ref'
];

/**
 * Create standardized subfolder structure within an existing project folder
 * @param projectPath - Full path to the project folder (e.g., "/clients - grizzle/Client Name/YY_MM - Project")
 * @returns Result with success status and any errors
 */
export async function createStandardFolderStructure(projectPath: string) {
    console.log(`📁 Creating standard folder structure in: ${projectPath}`);
    console.log(`📁 Folders to create: ${STANDARD_FOLDERS.join(', ')}`);

    if (!process.env.DROPBOX_REFRESH_TOKEN && !process.env.DROPBOX_ACCESS_TOKEN) {
        console.warn("[Dropbox] No credentials found. returning mock result.");
        return {
            success: true,
            mock: true,
            note: "Folders not actually created (missing creds)"
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

        const results: { folderName: string; success: boolean; error?: string }[] = [];

        // Create folders sequentially to avoid rate limiting
        for (const folderName of STANDARD_FOLDERS) {
            const folderPath = `${projectPath}/${folderName}`;
            console.log(`📂 Creating folder: ${folderPath}`);

            try {
                await dbx.filesCreateFolderV2({ path: folderPath });
                console.log(`✅ Created: ${folderName}`);
                results.push({ folderName, success: true });
            } catch (error: any) {
                // Check for folder already exists (conflict error)
                if (error?.status === 409 ||
                    error?.error?.error?.['.tag'] === 'path' ||
                    error?.error?.error_summary?.includes('conflict')) {
                    console.log(`ℹ️ Already exists: ${folderName}`);
                    results.push({ folderName, success: true });
                } else {
                    console.error(`❌ Failed to create ${folderName}:`, error?.message || error);
                    results.push({ folderName, success: false, error: error?.message || 'Unknown error' });
                }
            }

            // Small delay between API calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`🎉 Created ${successCount}/${STANDARD_FOLDERS.length} folders`);
        console.log(`📁 Results:`, JSON.stringify(results, null, 2));

        return {
            success: successCount === STANDARD_FOLDERS.length,
            foldersCreated: successCount,
            details: results
        };
    } catch (error: any) {
        console.error('[Dropbox] Error creating folder structure:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Create web link shortcuts (.url files) for reference links in the Brief folder
 * @param projectPath - Full path to the project folder
 * @param referenceLinks - Array of URLs to create shortcuts for
 * @returns Result with count of links created
 */
export async function uploadReferenceLinks(projectPath: string, referenceLinks: string[]) {
    if (!referenceLinks || referenceLinks.length === 0) {
        return { success: true, count: 0 };
    }

    console.log(`🔗 Uploading ${referenceLinks.length} reference links to ${projectPath}/Ref`);

    if (!process.env.DROPBOX_REFRESH_TOKEN && !process.env.DROPBOX_ACCESS_TOKEN) {
        console.warn("[Dropbox] No credentials found. returning mock result.");
        return {
            success: true,
            count: referenceLinks.length,
            mock: true
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

        // Reference links go in the Ref folder
        const refPath = `${projectPath}/Ref`;

        // Create shortcuts for each reference link
        const results = await Promise.allSettled(
            referenceLinks.map(async (url, index) => {
                // Extract domain or use generic name
                let linkName = `Reference_${index + 1}`;
                try {
                    const urlObj = new URL(url);
                    linkName = urlObj.hostname.replace('www.', '').replace(/\./g, '_');
                } catch {
                    // Keep generic name if URL parsing fails
                }

                const shortcutPath = `${refPath}/${linkName}.url`;

                // Create .url file content (Windows Internet Shortcut format)
                const urlFileContent = `[InternetShortcut]\nURL=${url}\n`;

                try {
                    await dbx.filesUpload({
                        path: shortcutPath,
                        contents: urlFileContent,
                        mode: { '.tag': 'add' },
                        autorename: true // Auto-rename if conflict
                    });
                    console.log(`✅ Created shortcut: ${linkName}.url`);
                    return { url, success: true };
                } catch (error: any) {
                    console.error(`❌ Failed to create shortcut for ${url}:`, error.message);
                    return { url, success: false, error: error.message };
                }
            })
        );

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        console.log(`🎉 Uploaded ${successCount}/${referenceLinks.length} reference links`);

        return {
            success: true,
            count: successCount,
            total: referenceLinks.length,
            details: results
        };
    } catch (error: any) {
        console.error('[Dropbox] Error uploading reference links:', error);
        return {
            success: false,
            error: error.message || 'Unknown error',
            count: 0
        };
    }
}

