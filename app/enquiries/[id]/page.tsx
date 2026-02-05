import { AppShell } from "@/components/layout/Shell";
import { getEnquiry } from "@/app/actions/get-enquiry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, User, Calendar, DollarSign, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ConvertToProjectDialog } from "@/components/projects/convert-dialog";
import { EditEnquiryDialog } from "@/components/enquiries/edit-enquiry-dialog";
import { DeleteEnquiryButton } from "@/components/enquiries/delete-enquiry-button";
import { AttachmentsSection } from "@/components/enquiries/attachments-section";
import { ActivityTimeline } from "@/components/enquiries/activity-timeline";
import { LinkPreviewCard } from "@/components/ui/link-preview-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";


export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const enquiry = await getEnquiry(id);

    if (!enquiry) {
        notFound();
    }

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/enquiries">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {enquiry.projectTitle || "Enquiry Details"}
                        </h2>
                        <p className="text-muted-foreground">
                            {formatDistanceToNow(new Date(enquiry.receivedAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {enquiry.project ? (
                            <Link href={`/projects/${enquiry.project.id}`}>
                                <Button>View Project</Button>
                            </Link>
                        ) : (
                            <>
                                <ConvertToProjectDialog
                                    enquiryId={enquiry.id}
                                    existingClientId={enquiry.company?.id}
                                    existingProjectTitle={enquiry.projectTitle}
                                    existingContactId={enquiry.contact?.id}
                                />
                                <DeleteEnquiryButton enquiryId={enquiry.id} hasProject={!!enquiry.project} />
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Project Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {enquiry.projectDescription && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                                    <p className="text-sm">{enquiry.projectDescription}</p>
                                </div>
                            )}

                            {(enquiry.budgetMin || enquiry.budgetMax || enquiry.budget) && (
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Budget</p>
                                        <p className="text-sm">
                                            {enquiry.budgetMin && enquiry.budgetMax
                                                ? `${enquiry.budgetMin} - ${enquiry.budgetMax}`
                                                : enquiry.budgetMin || enquiry.budgetMax || enquiry.budget}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {enquiry.timeline && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                                        <p className="text-sm">{enquiry.timeline}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Received</p>
                                    <p className="text-sm">
                                        {new Date(enquiry.receivedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                                {enquiry.project ? (
                                    <Badge variant="default">Converted to Project</Badge>
                                ) : (
                                    <Badge variant="secondary">{enquiry.status}</Badge>
                                )}
                            </div>

                            {/* Deliverables Section */}
                            {enquiry.deliverables && enquiry.deliverables.length > 0 && (
                                <div className="pt-2 border-t">
                                    <p className="text-sm font-medium text-muted-foreground mb-3">Deliverables ({enquiry.deliverables.length})</p>
                                    <div className="space-y-3">
                                        {enquiry.deliverables.map((del: any, idx: number) => (
                                            <div key={del.id} className="bg-muted/30 rounded-lg p-3">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-medium text-sm">{del.name || `Deliverable ${idx + 1}`}</p>
                                                    {del.required && (
                                                        <Badge variant="outline" className="text-xs">Required</Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                    {del.frameRate && (
                                                        <div>
                                                            <span className="font-medium">Frame Rate:</span> {del.frameRate}
                                                        </div>
                                                    )}
                                                    {del.aspectRatio && (
                                                        <div>
                                                            <span className="font-medium">Aspect Ratio:</span> {del.aspectRatio}
                                                        </div>
                                                    )}
                                                    {(del.width && del.height) && (
                                                        <div>
                                                            <span className="font-medium">Dimensions:</span> {del.width}x{del.height}
                                                        </div>
                                                    )}
                                                    {del.duration && (
                                                        <div>
                                                            <span className="font-medium">Duration:</span> {del.duration}
                                                        </div>
                                                    )}
                                                </div>
                                                {del.description && (
                                                    <p className="text-xs text-muted-foreground mt-2">{del.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Company & Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Company & Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {enquiry.company && (
                                <div className="flex items-start gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Company</p>
                                        <Link href={`/companies/${enquiry.company.id}`} className="text-sm hover:underline">
                                            {enquiry.company.name}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {enquiry.contact && (
                                <div className="flex items-start gap-2">
                                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Contact</p>
                                        <p className="text-sm">
                                            {enquiry.contact.firstName} {enquiry.contact.lastName}
                                        </p>
                                        {enquiry.contact.email && (
                                            <p className="text-sm text-muted-foreground">{enquiry.contact.email}</p>
                                        )}
                                        {enquiry.contact.phone && (
                                            <p className="text-sm text-muted-foreground">{enquiry.contact.phone}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Reference Links (if they exist outside deliverables) */}
                {enquiry.referenceLinks && JSON.parse(enquiry.referenceLinks).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Reference Links</CardTitle>
                            <CardDescription>Inspiration and examples provided by the client</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {JSON.parse(enquiry.referenceLinks).map((link: string, index: number) => (
                                    <LinkPreviewCard key={index} url={link} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Attachments & Activity */}
                <div className="grid gap-6 md:grid-cols-2">
                    <AttachmentsSection
                        enquiryId={enquiry.id}
                        attachments={enquiry.attachments}
                    />
                    <ActivityTimeline
                        enquiryId={enquiry.id}
                        activities={enquiry.activities}
                    />
                </div>

                {/* Original Content */}
                {enquiry.rawContent && (
                    <Collapsible defaultOpen={false}>
                        <Card>
                            <CollapsibleTrigger className="w-full">
                                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <CardTitle>Original Content</CardTitle>
                                            <CardDescription>Raw email or message content</CardDescription>
                                        </div>
                                        <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent>
                                    <div className="max-h-96 overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
                                        <pre className="whitespace-pre-wrap text-sm font-mono">{enquiry.rawContent}</pre>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                )}
            </div>
        </AppShell >
    );
}
