// Test script to verify the API endpoint returns deliverables
async function testEnquiryAPI() {
    const enquiryId = 'cml9idk000001bnol54kau9zg';

    console.log(`Testing API: /api/enquiry/${enquiryId}`);

    const response = await fetch(`http://localhost:3000/api/enquiry/${enquiryId}`);
    const data = await response.json();

    console.log('\n✅ API Response:');
    console.log(`  Enquiry: ${data.projectTitle}`);
    console.log(`  Deliverables count: ${data.deliverables?.length || 0}`);

    if (data.deliverables && data.deliverables.length > 0) {
        console.log('\n📋 Deliverables:');
        data.deliverables.forEach((del: any, idx: number) => {
            console.log(`  ${idx + 1}. ${del.name}`);
            console.log(`     Frame Rate: ${del.frameRate}`);
            console.log(`     Aspect Ratio: ${del.aspectRatio}`);
            console.log(`     Dimensions: ${del.width}x${del.height}`);
            console.log(`     Duration: ${del.duration}`);
        });
    } else {
        console.log('\n❌ No deliverables found!');
    }
}

testEnquiryAPI().catch(console.error);
