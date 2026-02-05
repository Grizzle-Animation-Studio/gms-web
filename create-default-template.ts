import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDefaultTemplate() {
    console.log('Creating default checklist template...');

    // First, unset any existing defaults
    await prisma.checklistTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
    });

    // Create the new default template
    const template = await prisma.checklistTemplate.create({
        data: {
            name: 'Standard Project Onboarding',
            description: 'Default checklist for all new video production projects',
            isDefault: true,
            items: {
                create: [
                    {
                        title: 'Contract signed',
                        description: 'Signed contract received from client',
                        required: true,
                        defaultOwner: 'client',
                        sortOrder: 1
                    },
                    {
                        title: 'Brief confirmed',
                        description: 'Project brief and requirements confirmed with client',
                        required: true,
                        defaultOwner: 'grizzle',
                        sortOrder: 2
                    },
                    {
                        title: 'Assets received',
                        description: 'All required assets (logos, footage, etc.) received from client',
                        required: true,
                        defaultOwner: 'client',
                        sortOrder: 3
                    },
                    {
                        title: 'NDA signed',
                        description: 'Non-disclosure agreement signed if required',
                        required: true,
                        defaultOwner: 'client',
                        sortOrder: 4
                    },
                    {
                        title: 'Payment deposit received',
                        description: 'Initial payment or deposit confirmed',
                        required: true,
                        defaultOwner: 'client',
                        sortOrder: 5
                    },
                    {
                        title: 'Reference materials uploaded',
                        description: 'All reference links and materials uploaded to Dropbox',
                        required: false,
                        defaultOwner: 'grizzle',
                        sortOrder: 6
                    }
                ]
            }
        },
        include: {
            items: true
        }
    });

    console.log(`✅ Created default template: "${template.name}" with ${template.items.length} items`);
    console.log('Template ID:', template.id);
    console.log('Items:');
    template.items.forEach(item => {
        console.log(`  - ${item.title} (${item.required ? 'Required' : 'Optional'}, ${item.defaultOwner})`);
    });
}

createDefaultTemplate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
