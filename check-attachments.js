// Quick test script to check attachments in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAttachments() {
    const attachments = await prisma.enquiryAttachment.findMany({
        select: {
            id: true,
            filename: true,
            fileSize: true,
            enquiryId: true,
        }
    });

    console.log(`Found ${attachments.length} attachments:`);
    attachments.forEach(att => {
        console.log(`- ${att.filename} (${att.fileSize} bytes) - ID: ${att.id}`);
    });

    await prisma.$disconnect();
}

checkAttachments();
