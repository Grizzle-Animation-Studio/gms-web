import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Mail, Phone, MapPin, Building2, Calendar, Pencil } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { DeleteCompanyButton } from "@/components/companies/delete-company-button";
import { EditCompanyDialog } from "@/components/companies/edit-company-dialog";
import { CompanyLogo } from "@/components/companies/company-logo";

async function getCompany(id: string) {
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            projects: {
                orderBy: { createdAt: "desc" },
            },
            contactsClientSide: {
                orderBy: { createdAt: "desc" },
            },
        },
    });
    return company;
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const company = await getCompany(id);

    if (!company) {
        notFound();
    }

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        <CompanyLogo
                            companyId={company.id}
                            companyName={company.name}
                            website={(company as any).website || null}
                            logoUrl={(company as any).logoUrl || null}
                        />
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline">
                                    {company.projects.length} project{company.projects.length !== 1 ? 's' : ''}
                                </Badge>
                                {company.xeroContactId && (
                                    <Badge variant="secondary">Linked to Xero</Badge>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">{company.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <EditCompanyDialog company={company} />
                        <DeleteCompanyButton companyId={company.id} hasProjects={company.projects.length > 0} />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Info */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {company.companyEmail && (
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <a href={`mailto:${company.companyEmail}`} className="hover:underline">
                                            {company.companyEmail}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {company.companyPhone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <a href={`tel:${company.companyPhone}`} className="hover:underline">
                                            {company.companyPhone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {(company.street || company.city || company.state || company.postcode) && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Address</p>
                                        <div>
                                            {company.street && <p>{company.street}</p>}
                                            {(company.city || company.state || company.postcode) && (
                                                <p>
                                                    {[company.city, company.state, company.postcode]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {company.abn && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">ABN</p>
                                        <p>{company.abn}</p>
                                    </div>
                                </div>
                            )}

                            {company.website && (
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Website</p>
                                        <a
                                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline text-primary"
                                        >
                                            {company.website}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {!company.companyEmail && !company.companyPhone && !company.street && !company.abn && !company.website && (
                                <p className="text-sm text-muted-foreground">
                                    No additional contact information available
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="text-muted-foreground mb-1">Created</p>
                                <p>{formatDistanceToNow(company.createdAt, { addSuffix: true })}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Last Updated</p>
                                <p>{formatDistanceToNow(company.updatedAt, { addSuffix: true })}</p>
                            </div>
                            {company.xeroSyncedAt && (
                                <div>
                                    <p className="text-muted-foreground mb-1">Xero Synced</p>
                                    <p>{formatDistanceToNow(company.xeroSyncedAt, { addSuffix: true })}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Contacts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contacts</CardTitle>
                        <CardDescription>
                            {company.contactsClientSide.length === 0
                                ? "No contacts yet"
                                : `${company.contactsClientSide.length} contact${company.contactsClientSide.length !== 1 ? 's' : ''}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {company.contactsClientSide.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No contacts have been added for this company yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {company.contactsClientSide.map((contact: any) => (
                                    <div
                                        key={contact.id}
                                        className="p-4 border rounded-lg"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-medium">
                                                    {contact.firstName} {contact.lastName || ''}
                                                </h4>
                                                {contact.jobTitle && (
                                                    <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>
                                                )}
                                                <div className="flex flex-col gap-1 mt-2">
                                                    {contact.email && (
                                                        <a href={`mailto:${contact.email}`} className="text-sm hover:underline flex items-center gap-2">
                                                            <Mail className="w-3 h-3" />
                                                            {contact.email}
                                                        </a>
                                                    )}
                                                    {contact.phone && (
                                                        <a href={`tel:${contact.phone}`} className="text-sm hover:underline flex items-center gap-2">
                                                            <Phone className="w-3 h-3" />
                                                            {contact.phone}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Added {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Projects */}
                <Card>
                    <CardHeader>
                        <CardTitle>Projects</CardTitle>
                        <CardDescription>
                            {company.projects.length === 0
                                ? "No projects yet"
                                : `${company.projects.length} project${company.projects.length !== 1 ? 's' : ''}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {company.projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No projects have been created for this company yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {company.projects.map((project: any) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="block p-4 border rounded-lg hover:border-primary transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium">{project.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Created {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                                                </p>
                                            </div>
                                            <Badge variant={project.status === "ACTIVE" || project.status === "APPROVED" ? "default" : "secondary"}>
                                                {project.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
