import { AppShell } from "@/components/layout/Shell";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Folder, Clock, ChevronDown, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { LinkPreviewCard } from "@/components/ui/link-preview-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// We'll add this server action next
import { ApproveProjectButton } from "@/components/projects/approve-button";
import { DeleteProjectButton } from "@/components/projects/delete-button";
import { ChangeClientDialog } from "@/components/projects/change-client-dialog";
import { AddDeliverableDialog, EditDeliverableDialog } from "@/components/projects/deliverable-dialogs";
import { ProjectChecklist } from "@/components/projects/project-checklist";
import { StartProductionButton } from "@/components/projects/start-production-button";
import { canStartProduction, getProjectChecklist, getChecklistTemplates } from "@/app/actions/checklist";

async function getProject(id: string) {
    const project = await prisma.project.findUnique({
        where: { id },
        include: { company: true, contact: true, enquiry: true, deliverables: true },
    });
    return project;
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await getProject(id);

    if (!project) {
        notFound();
    }

    // Fetch checklist data
    const [checklistItems, productionStatus, templates] = await Promise.all([
        getProjectChecklist(id),
        canStartProduction(id),
        getChecklistTemplates()
    ]);

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-muted-foreground">
                                {project.company.name}
                            </Badge>
                            <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                                {project.status}
                            </Badge>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">{project.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {project.status === "PROPOSED" && (
                            <ApproveProjectButton projectId={project.id} />
                        )}
                        {project.status === "ACTIVE" && (
                            <StartProductionButton
                                projectId={project.id}
                                canStart={productionStatus.canStart}
                                pendingItems={productionStatus.pendingItems}
                                requiredCount={productionStatus.requiredItems}
                                completedCount={productionStatus.completedItems}
                            />
                        )}
                        {project.dropboxPath && (
                            <Button variant="outline">
                                <Folder className="w-4 h-4 mr-2" />
                                Open in Dropbox
                            </Button>
                        )}
                        <ChangeClientDialog
                            projectId={project.id}
                            currentClientId={project.companyId}
                        />
                        <DeleteProjectButton projectId={project.id} />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Info */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Project Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Reference Links as Thumbnails */}
                            {project.enquiry?.referenceLinks && JSON.parse(project.enquiry.referenceLinks).length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium mb-3">Reference Links</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {JSON.parse(project.enquiry.referenceLinks).map((link: string, index: number) => (
                                            <LinkPreviewCard key={index} url={link} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Collapsible Original Content */}
                            {project.enquiry?.rawContent && (
                                <Collapsible defaultOpen={false}>
                                    <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                                            <h4 className="text-sm font-medium">Original Enquiry Content</h4>
                                            <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="max-h-96 overflow-y-auto p-3 bg-muted/50 rounded-md mt-2 border border-border">
                                            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono">
                                                {project.enquiry.rawContent}
                                            </pre>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}

                            <div>
                                <h4 className="text-sm font-medium mb-1">Budget</h4>
                                <p className="text-sm">
                                    {project.budgetMin && project.budgetMax
                                        ? `${project.budgetMin} - ${project.budgetMax}`
                                        : project.budget || "Not set"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar / Timeline Mock */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Timeline</CardTitle>
                            <CardDescription>Activity history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="mt-1 bg-primary/10 p-1 rounded-full h-fit">
                                        <Clock className="w-3 h-3 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Project Created</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(project.createdAt)} ago</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Deliverables Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Deliverables</CardTitle>
                            <CardDescription>
                                {project.deliverables?.length || 0} output specification{(project.deliverables?.length || 0) !== 1 ? 's' : ''}
                            </CardDescription>
                        </div>
                        <AddDeliverableDialog projectId={project.id} />
                    </CardHeader>
                    <CardContent>
                        {project.deliverables && project.deliverables.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {project.deliverables.map((deliverable) => (
                                    <div key={deliverable.id} className="p-3 border rounded-md bg-muted/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">{deliverable.name}</h4>
                                            <EditDeliverableDialog deliverable={deliverable} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Frame Rate</p>
                                                <p>{deliverable.frameRate || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Size</p>
                                                <p>{deliverable.width && deliverable.height ? `${deliverable.width}×${deliverable.height}` : '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Aspect Ratio</p>
                                                <p>{deliverable.aspectRatio || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Length</p>
                                                <p>{deliverable.duration || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No deliverables yet. Click "Add Deliverable" to create one.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Production Checklist */}
                <ProjectChecklist
                    projectId={project.id}
                    items={checklistItems}
                    canStart={productionStatus.canStart}
                    templates={templates.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))}
                />
            </div>
        </AppShell>
    );
}
