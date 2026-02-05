import dotenv from 'dotenv';
import path from 'path';
import { Dropbox } from 'dropbox';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function getRefreshToken(authorizationCode: string) {
    const appKey = process.env.DROPBOX_APP_KEY;
    const appSecret = process.env.DROPBOX_APP_SECRET;

    if (!appKey || !appSecret) {
        console.error("❌ Missing DROPBOX_APP_KEY or DROPBOX_APP_SECRET in .env file");
        process.exit(1);
    }

    console.log("🔄 Exchanging authorization code for refresh token...\n");

    try {
        const dbx = new Dropbox({
            clientId: appKey,
            clientSecret: appSecret
        });

        // Exchange the authorization code for tokens
        const response = await dbx.auth.getAccessTokenFromCode('', authorizationCode);

        console.log("✅ Success! Here are your tokens:\n");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("\n📋 REFRESH TOKEN (add this to your .env file):");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`DROPBOX_REFRESH_TOKEN=${response.result.refresh_token}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        console.log("📝 Full response:");
        console.log(JSON.stringify(response.result, null, 2));

        console.log("\n✨ Next steps:");
        console.log("1. Copy the DROPBOX_REFRESH_TOKEN line above");
        console.log("2. Add it to your .env file");
        console.log("3. Remove or comment out the old DROPBOX_ACCESS_TOKEN line");
        console.log("4. Restart your dev server");

    } catch (error: any) {
        console.error("❌ Error exchanging code for token:");
        console.error(error.error || error.message || error);
        console.log("\n💡 Common issues:");
        console.log("- The authorization code has already been used (codes are single-use)");
        console.log("- The authorization code has expired (they expire after a few minutes)");
        console.log("- The APP_KEY or APP_SECRET in your .env file is incorrect");
        console.log("\n🔄 If you see an error, generate a new authorization code and try again.");
        process.exit(1);
    }
}

// Get the authorization code from command line argument
const authCode = process.argv[2];

if (!authCode) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Dropbox Refresh Token Generator");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("❌ Error: No authorization code provided\n");
    console.log("📋 Usage:");
    console.log("  npx tsx scripts/get-dropbox-refresh-token.ts <AUTHORIZATION_CODE>\n");
    console.log("🌐 Step 1: Get your authorization code by visiting this URL:\n");
    console.log(`https://www.dropbox.com/oauth2/authorize?client_id=${process.env.DROPBOX_APP_KEY}&token_access_type=offline&response_type=code\n`);
    console.log("📝 Step 2: Click 'Allow' and copy the code from the redirect URL");
    console.log("🚀 Step 3: Run this script again with the code as an argument\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
}

getRefreshToken(authCode);
