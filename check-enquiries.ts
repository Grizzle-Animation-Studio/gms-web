import { prisma } from './lib/db';

async function checkData() {
    console.log('\n=== ALL Enquiries (newest first) ===\n');
    const enquiries = await prisma.enquiry.findMany({
        include: { company: true, contact: true },
        orderBy: { receivedAt: 'desc' },
        take: 10,
    });

    enquiries.forEach((enq, idx) => {
        console.log(`${idx + 1}. [${enq.receivedAt.toISOString()}] ${enq.id.substring(0, 10)}...`);
        console.log(`   Content: "${enq.rawContent.substring(0, 60)}..."`);
        console.log(`   CompanyID: ${enq.companyId || '❌ NULL'}`);
        console.log(`   Company: ${enq.company?.name || '❌ NOT LINKED'}`);
        console.log(`   ContactID: ${enq.contactId || '❌ NULL'}`);
        console.log(`   Project Title: ${enq.projectTitle || '(none)'}`);
        console.log('');
    });

    console.log('\n=== Companies Created Recently ===\n');
    const companies = await prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    companies.forEach((comp, idx) => {
        console.log(`${idx + 1}. ${comp.name} (ID: ${comp.id.substring(0, 15)}...)`);
        console.log(`   Created: ${comp.createdAt.toISOString()}`);
        console.log(`   Email: ${comp.companyEmail || '(none)'}`);
        console.log('');
    });

    await prisma.$disconnect();
}

checkData().catch(console.error);
