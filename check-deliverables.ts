import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDeliverables() {
    console.log('Checking EnquiryDeliverable table...\n');

    const deliverables = await prisma.enquiryDeliverable.findMany({
        include: {
            enquiry: {
                select: { projectTitle: true }
            }
        }
    });

    console.log(`Found ${deliverables.length} deliverables in database:\n`);

    deliverables.forEach(del => {
        console.log(`- Enquiry: ${del.enquiry.projectTitle}`);
        console.log(`  Name: ${del.name}`);
        console.log(`  Frame Rate: ${del.frameRate}`);
        console.log(`  Aspect Ratio: ${del.aspectRatio}`);
        console.log(`  Width x Height: ${del.width}x${del.height}`);
        console.log('');
    });

    if (deliverables.length === 0) {
        console.log('❌ NO DELIVERABLES FOUND!');
        console.log('This means the Prisma client was NOT regenerated properly.');
        console.log('Or enquiries were created BEFORE the schema changes.');
    }
}

checkDeliverables()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
