import { AppShell } from "@/components/layout/Shell";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { ProjectsList } from "@/components/projects/projects-list";

export const dynamic = "force-dynamic";

async function getProjects() {
    const projects = await prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
            company: true,
            contact: true,
        },
    });
    return projects;
}

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                        <p className="text-muted-foreground">Active and proposed projects.</p>
                    </div>
                    <Link href="/enquiries">
                        <Button variant="outline">New Project via Enquiry</Button>
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No projects yet</p>
                            <p className="text-sm text-muted-foreground">
                                Convert an enquiry to create your first project
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <ProjectsList initialProjects={projects} />
                )}
            </div>
        </AppShell>
    );
}
