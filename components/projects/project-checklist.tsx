"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Circle,
    Clock,
    XCircle,
    User,
    Building2,
    ChevronDown,
    ChevronUp,
    Plus,
    AlertTriangle,
    Loader2
} from "lucide-react";
import {
    updateChecklistItemStatus,
    addCustomChecklistItem,
    initializeProjectChecklist
} from "@/app/actions/checklist";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type ChecklistItem = {
    id: string;
    title: string;
    description: string | null;
    required: boolean;
    status: string;
    owner: string;
    dueDate: Date | null;
    evidenceUrl: string | null;
    waivedReason: string | null;
    completedAt: Date | null;
    completedBy: string | null;
};

type Template = {
    id: string;
    name: string;
};

interface ProjectChecklistProps {
    projectId: string;
    items: ChecklistItem[];
    canStart: boolean;
    templates?: Template[];
}

const statusIcons = {
    missing: <Circle className="h-5 w-5 text-muted-foreground" />,
    in_progress: <Clock className="h-5 w-5 text-blue-500" />,
    done: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    waived: <XCircle className="h-5 w-5 text-amber-500" />
};

const statusLabels = {
    missing: "Missing",
    in_progress: "In Progress",
    done: "Done",
    waived: "Waived"
};

export function ProjectChecklist({ projectId, items, canStart, templates = [] }: ProjectChecklistProps) {
    const [expanded, setExpanded] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [waiverDialogOpen, setWaiverDialogOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [waiverReason, setWaiverReason] = useState("");

    // New item form state
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newOwner, setNewOwner] = useState("grizzle");
    const [newRequired, setNewRequired] = useState(true);

    const completedCount = items.filter(i => i.status === "done" || i.status === "waived").length;
    const totalCount = items.length;
    const requiredPending = items.filter(i => i.required && i.status !== "done" && i.status !== "waived").length;

    function handleStatusChange(itemId: string, newStatus: string) {
        if (newStatus === "waived") {
            setSelectedItemId(itemId);
            setWaiverDialogOpen(true);
            return;
        }

        startTransition(async () => {
            await updateChecklistItemStatus(
                itemId,
                newStatus as "missing" | "in_progress" | "done" | "waived",
                "Current User" // TODO: Get from auth
            );
        });
    }

    function handleWaive() {
        if (!selectedItemId) return;

        startTransition(async () => {
            await updateChecklistItemStatus(
                selectedItemId,
                "waived",
                "Current User",
                waiverReason
            );
            setWaiverDialogOpen(false);
            setWaiverReason("");
            setSelectedItemId(null);
        });
    }

    function handleAddItem() {
        if (!newTitle.trim()) return;

        startTransition(async () => {
            await addCustomChecklistItem(
                projectId,
                newTitle,
                newDescription || undefined,
                newRequired,
                newOwner
            );
            setAddDialogOpen(false);
            setNewTitle("");
            setNewDescription("");
            setNewOwner("grizzle");
            setNewRequired(true);
        });
    }

    function handleInitialize(templateId?: string) {
        startTransition(async () => {
            await initializeProjectChecklist(projectId, templateId);
        });
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">Production Checklist</CardTitle>
                        {completedCount === totalCount && totalCount > 0 ? (
                            <Badge className="bg-green-500/10 text-green-700 border-green-500/20 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {completedCount}/{totalCount} Complete
                            </Badge>
                        ) : (
                            <Badge variant="secondary">
                                {completedCount}/{totalCount} Complete
                            </Badge>
                        )}
                        {requiredPending > 0 && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {requiredPending} Required
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Checklist Item</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="e.g., Client approval received"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description (optional)</Label>
                                        <Textarea
                                            id="description"
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            placeholder="Additional details..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Owner</Label>
                                            <Select value={newOwner} onValueChange={setNewOwner}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="grizzle">Grizzle</SelectItem>
                                                    <SelectItem value="client">Client</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Required?</Label>
                                            <Select
                                                value={newRequired ? "yes" : "no"}
                                                onValueChange={(v) => setNewRequired(v === "yes")}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="yes">Yes</SelectItem>
                                                    <SelectItem value="no">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button onClick={handleAddItem} disabled={isPending || !newTitle.trim()}>
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Add Item
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent>
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="mb-4">No checklist items yet.</p>
                            {templates.length > 0 && (
                                <div className="flex flex-col gap-2 items-center">
                                    <p className="text-sm">Initialize from template:</p>
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        {templates.map(template => (
                                            <Button
                                                key={template.id}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleInitialize(template.id)}
                                                disabled={isPending}
                                            >
                                                {template.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-0 divide-y">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="py-4 flex items-center gap-4 group hover:bg-muted/30 -mx-4 px-4 transition-colors"
                                >
                                    {/* Status icon */}
                                    <div className="flex-shrink-0">
                                        {statusIcons[item.status as keyof typeof statusIcons]}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-medium mb-1 ${item.status === 'waived' ? 'line-through text-muted-foreground' : ''}`}>
                                            {item.title}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Status Badge */}
                                            {item.status === 'done' && (
                                                <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Done</Badge>
                                            )}
                                            {item.status === 'in_progress' && (
                                                <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">In Progress</Badge>
                                            )}
                                            {item.status === 'missing' && (
                                                <Badge variant="outline" className="text-muted-foreground">Missing</Badge>
                                            )}
                                            {item.status === 'waived' && (
                                                <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">Waived</Badge>
                                            )}

                                            {/* Required Badge */}
                                            {item.required && (
                                                <Badge variant="destructive" className="text-xs">Required</Badge>
                                            )}

                                            {/* Owner Badge */}
                                            <Badge variant="secondary" className="text-xs gap-1">
                                                {item.owner === "client" ? (
                                                    <User className="h-3 w-3" />
                                                ) : (
                                                    <Building2 className="h-3 w-3" />
                                                )}
                                                {item.owner === "client" ? "Client" : "Grizzle"}
                                            </Badge>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground mt-1.5">
                                                {item.description}
                                            </p>
                                        )}
                                        {item.waivedReason && (
                                            <p className="text-sm text-amber-600 mt-1.5 italic">
                                                Waived: {item.waivedReason}
                                            </p>
                                        )}
                                        {item.completedAt && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {item.status === "done" ? "Completed" : "Waived"} by {item.completedBy} on{" "}
                                                {new Date(item.completedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status selector */}
                                    <Select
                                        value={item.status}
                                        onValueChange={(value) => handleStatusChange(item.id, value)}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="missing">Missing</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                            <SelectItem value="waived">Waived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    )
                    }
                </CardContent >
            )}

            {/* Waiver reason dialog */}
            <Dialog open={waiverDialogOpen} onOpenChange={setWaiverDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Waive Checklist Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="waiver-reason">Reason for waiving</Label>
                            <Textarea
                                id="waiver-reason"
                                value={waiverReason}
                                onChange={(e) => setWaiverReason(e.target.value)}
                                placeholder="e.g., Client confirmed verbally, not applicable for this project..."
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setWaiverDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleWaive} disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Waive Item
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card >
    );
}
