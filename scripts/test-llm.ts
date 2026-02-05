/**
 * Test script to verify LM Studio connection
 * Run with: npx tsx scripts/test-llm.ts
 */

import { parseEnquiryWithLLM, checkLLMAvailability } from "../lib/llm";

async function testLLM() {
    console.log("🧪 Testing LM Studio connection...\n");

    // Test 1: Check if LM Studio is available
    console.log("1️⃣ Checking LM Studio availability...");
    const isAvailable = await checkLLMAvailability();

    if (!isAvailable) {
        console.error("❌ LM Studio is not available. Please make sure:");
        console.error("   - LM Studio is running");
        console.error("   - Server is started on http://localhost:1234");
        console.error("   - Qwen 2.5 14B model is loaded");
        process.exit(1);
    }

    console.log("✅ LM Studio is available!\n");

    // Test 2: Parse a sample enquiry
    console.log("2️⃣ Testing enquiry parsing...");
    const sampleEnquiry = `
Hi there,

We're ABC Corporation and we'd like to commission a new website for our business.
We're looking at a budget of around $25,000 and would ideally need it completed 
by the end of Q2 2024.

Let me know if you can help!

Thanks,
John Smith
    `.trim();

    console.log("Sample enquiry:");
    console.log("---");
    console.log(sampleEnquiry);
    console.log("---\n");

    try {
        const result = await parseEnquiryWithLLM(sampleEnquiry);

        console.log("✅ Successfully parsed!\n");
        console.log("📊 Extracted Information:");
        console.log(JSON.stringify(result, null, 2));

        console.log("\n🎉 All tests passed!");
    } catch (error) {
        console.error("❌ Failed to parse enquiry:", error);
        process.exit(1);
    }
}

testLLM().catch(console.error);
