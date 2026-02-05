import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { Users, Upload } from "lucide-react";
import { ContactsList } from "@/components/contacts/contacts-list";
import Link from "next/link";

async function getContactsGroupedByCompany() {
    const companies = await prisma.company.findMany({
        include: {
            contactsClientSide: {
                include: {
                    enquiries: {
                        orderBy: { receivedAt: "desc" },
                        take: 1,
                    },
                },
                orderBy: { firstName: "asc" },
            },
        },
        orderBy: { name: "asc" },
    });

    return companies
        .filter((c) => c.contactsClientSide.length > 0)
        .map((company) => ({
            company: {
                id: company.id,
                name: company.name,
                xeroContactId: company.xeroContactId,
            },
            contacts: company.contactsClientSide,
        }));
}

export default async function ContactsPage() {
    const contactGroups = await getContactsGroupedByCompany();
    const totalContacts = contactGroups.reduce((sum, group) => sum + group.contacts.length, 0);

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
                        <p className="text-muted-foreground">
                            Manage contacts across all your companies
                        </p>
                    </div>
                    <Link href="/contacts/import">
                        <Button variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Import Contacts
                        </Button>
                    </Link>
                </div>

                {totalContacts === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Users className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No contacts yet</p>
                            <p className="text-sm text-muted-foreground">
                                Get started by adding your first contact
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <ContactsList initialGroups={contactGroups} />
                )}
            </div>
        </AppShell>
    );
}
