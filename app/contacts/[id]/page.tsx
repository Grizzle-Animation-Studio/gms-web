import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Mail, Phone, Briefcase, Building2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { DeleteContactButton } from "@/components/contacts/delete-contact-button";

async function getContact(id: string) {
    const contact = await prisma.contactClientSide.findUnique({
        where: { id },
        include: {
            company: true,
            enquiries: {
                orderBy: { receivedAt: "desc" },
            },
            projects: {
                orderBy: { createdAt: "desc" },
            },
        },
    });
    return contact;
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const contact = await getContact(id);

    if (!contact) {
        notFound();
    }

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">
                                {contact.enquiries.length} enquir{contact.enquiries.length !== 1 ? 'ies' : 'y'}
                            </Badge>
                            {contact.projects.length > 0 && (
                                <Badge variant="secondary">
                                    {contact.projects.length} project{contact.projects.length !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {contact.firstName} {contact.lastName}
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            <Link href={`/companies/${contact.company.id}`} className="hover:underline">
                                {contact.company.name}
                            </Link>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <DeleteContactButton
                            contactId={contact.id}
                            hasEnquiries={contact.enquiries.length > 0}
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Info */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {contact.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <a href={`mailto:${contact.email}`} className="hover:underline">
                                            {contact.email}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {contact.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <a href={`tel:${contact.phone}`} className="hover:underline">
                                            {contact.phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {contact.jobTitle && (
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Job Title</p>
                                        <p>{contact.jobTitle}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Company</p>
                                    <Link href={`/companies/${contact.company.id}`} className="hover:underline">
                                        {contact.company.name}
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium">Created</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(contact.createdAt)} ago
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Enquiries */}
                {contact.enquiries.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Enquiries ({contact.enquiries.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {contact.enquiries.map((enquiry) => (
                                    <Link
                                        key={enquiry.id}
                                        href={`/enquiries`}
                                        className="block p-3 rounded-lg border hover:border-primary transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{enquiry.projectTitle || "Untitled Enquiry"}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                    {enquiry.projectDescription || enquiry.rawContent.substring(0, 100) + "..."}
                                                </p>
                                            </div>
                                            <Badge variant={enquiry.status === "PENDING" ? "secondary" : "outline"}>
                                                {enquiry.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatDistanceToNow(enquiry.receivedAt)} ago
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Projects */}
                {contact.projects.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Projects ({contact.projects.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {contact.projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="block p-3 rounded-lg border hover:border-primary transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <p className="font-medium">{project.title}</p>
                                            <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                                                {project.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatDistanceToNow(project.createdAt)} ago
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}
