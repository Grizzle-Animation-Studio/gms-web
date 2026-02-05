
import dotenv from 'dotenv';
import { createProjectFolder } from '../lib/dropbox';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log("Testing Dropbox Integration...");
    console.log("APP_KEY present:", !!process.env.DROPBOX_APP_KEY);
    console.log("REFRESH_TOKEN present:", !!process.env.DROPBOX_REFRESH_TOKEN);
    console.log("ACCESS_TOKEN present:", !!process.env.DROPBOX_ACCESS_TOKEN);

    if (!process.env.DROPBOX_REFRESH_TOKEN && !process.env.DROPBOX_ACCESS_TOKEN) {
        console.error("Missing DROPBOX_REFRESH_TOKEN or DROPBOX_ACCESS_TOKEN");
        process.exit(1);
    }

    try {
        console.log("Attempting to create folder...");
        const result = await createProjectFolder("Script Test Client", "Script Test Project");
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Script failed:", e);
    }
}

main();
