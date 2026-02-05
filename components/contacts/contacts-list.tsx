"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";

type Contact = {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
    enquiries: any[];
};

type ContactsByCompany = {
    company: {
        id: string;
        name: string;
        xeroContactId: string | null;
    };
    contacts: Contact[];
};

export function ContactsList({ initialGroups }: { initialGroups: ContactsByCompany[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredGroups = initialGroups
        .map(group => ({
            ...group,
            contacts: group.contacts.filter(contact =>
                contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.phone?.includes(searchQuery) ||
                contact.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }))
        .filter(group => group.contacts.length > 0);

    return (
        <>
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search contacts by name, email, phone, or job title..."
            />

            {filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No contacts found matching your search" : "No contacts yet"}
                </div>
            ) : (
                <div className="space-y-8">
                    {filteredGroups.map((group) => (
                        <Card key={group.company.id}>
                            <CardContent className="p-6">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Link href={`/companies/${group.company.id}`} className="hover:underline">
                                            {group.company.name}
                                        </Link>
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {group.contacts.length} contact{group.contacts.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {group.contacts.map((contact) => (
                                        <Link
                                            key={contact.id}
                                            href={`/contacts/${contact.id}`}
                                            className="block"
                                        >
                                            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 hover:border-primary transition-colors cursor-pointer">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">
                                                                {contact.firstName} {contact.lastName}
                                                            </p>
                                                            {contact.jobTitle && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {contact.jobTitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="ml-13 space-y-1">
                                                        {contact.email && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                                <span>{contact.email}</span>
                                                            </div>
                                                        )}
                                                        {contact.phone && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                                <span>{contact.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    {contact.enquiries.length > 0 && (
                                                        <Badge variant="secondary" className="mb-2">
                                                            {contact.enquiries.length} enquir{contact.enquiries.length !== 1 ? 'ies' : 'y'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
}
