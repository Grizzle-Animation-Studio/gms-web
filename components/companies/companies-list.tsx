"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";

type Company = {
    id: string;
    name: string;
    companyEmail: string | null;
    companyPhone: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    xeroContactId: string | null;
    _count?: {
        projects: number;
    };
};

export function CompaniesList({ initialCompanies }: { initialCompanies: Company[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCompanies = initialCompanies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.companyEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.companyPhone?.includes(searchQuery)
    );

    return (
        <>
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search companies by name, email, or phone..."
            />

            {filteredCompanies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No companies found matching your search" : "No companies yet"}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCompanies.map((company) => (
                        <Link key={company.id} href={`/companies/${company.id}`}>
                            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{company.name}</CardTitle>
                                            {company._count?.projects && company._count.projects > 0 && (
                                                <Badge variant="secondary" className="mt-2">
                                                    {company._count.projects} project{company._count.projects !== 1 ? 's' : ''}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        {company.companyEmail && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                <span className="truncate">{company.companyEmail}</span>
                                            </div>
                                        )}
                                        {company.companyPhone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <span>{company.companyPhone}</span>
                                            </div>
                                        )}
                                        {(company.street || company.city || company.state) && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span className="truncate">
                                                    {[company.street, company.city, company.state]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </span>
                                            </div>
                                        )}
                                        {company.xeroContactId && (
                                            <Badge variant="outline" className="mt-2">
                                                Synced with Xero
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}
