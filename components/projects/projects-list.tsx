"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Building2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";
import { formatDistanceToNow } from "date-fns";

type Project = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: Date;
    company: {
        id: string;
        name: string;
    };
    contact: {
        id: string;
        firstName: string;
        lastName: string | null;
    } | null;
    dropboxFolderUrl: string | null;
};

export function ProjectsList({ initialProjects }: { initialProjects: Project[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProjects = initialProjects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.contact?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.contact?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search projects by title, description, company, or contact..."
            />

            {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No projects found matching your search" : "No projects yet"}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg">{project.title}</CardTitle>
                                        <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                                            {project.status.toLowerCase()}
                                        </Badge>
                                    </div>
                                    {project.description && (
                                        <CardDescription className="line-clamp-2">
                                            {project.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate">{project.company.name}</span>
                                        </div>
                                        {project.contact && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="truncate">
                                                    {project.contact.firstName} {project.contact.lastName}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {project.dropboxFolderUrl && (
                                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                                <ExternalLink className="h-3 w-3" />
                                                <span>Dropbox folder</span>
                                            </div>
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
