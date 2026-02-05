import { prisma } from './lib/db';
import { getCompanyById } from './app/actions/company';

async function testCompanySelector() {
    // Get the most recent enquiry
    const enquiry = await prisma.enquiry.findFirst({
        orderBy: { receivedAt: 'desc' },
    });

    if (!enquiry) {
        console.log('❌ No enquiries found');
        return;
    }

    console.log('\n=== Testing Company Selector Fix ===\n');
    console.log('Enquiry ID:', enquiry.id);
    console.log('Company ID:', enquiry.companyId || 'NULL');

    if (enquiry.companyId) {
        console.log('\n🧪 Testing getCompanyById with ID:', enquiry.companyId);
        const result = await getCompanyById(enquiry.companyId);

        if (result.success && result.company) {
            console.log('✅ SUCCESS! Company fetched:', result.company.name);
            console.log('   Email:', result.company.companyEmail || '(none)');
            console.log('\n🎉 The ClientSelector should now display this company!');
        } else {
            console.log('❌ FAILED! Error:', result.error);
        }
    } else {
        console.log('\n⚠️  This enquiry has no company linked');
    }

    await prisma.$disconnect();
}

testCompanySelector().catch(console.error);
