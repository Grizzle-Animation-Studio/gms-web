"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectFromEnquiry } from "@/app/actions/project";
import { ClientSelector } from "@/components/companies/company-combobox";
import { FolderPlus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Deliverable {
    name: string;
    frameRate: string;
    width: string;
    height: string;
    aspectRatio: string;
    duration: string;
}

const DEFAULT_DELIVERABLE: Deliverable = {
    name: "",
    frameRate: "25fps",
    width: "1920",
    height: "1080",
    aspectRatio: "16:9",
    duration: "30s"
};

function calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}

export function ConvertToProjectDialog({
    enquiryId,
    existingClientId,
    existingProjectTitle,
    existingContactId,
}: {
    enquiryId: string;
    existingClientId?: string | null;
    existingProjectTitle?: string | null;
    existingContactId?: string | null;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [clientId, setClientId] = useState<string | undefined>(existingClientId || undefined);
    const [projectTitle, setProjectTitle] = useState(existingProjectTitle || "");
    const [contactId] = useState<string | undefined>(existingContactId || undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deliverables, setDeliverables] = useState<Deliverable[]>([
        { ...DEFAULT_DELIVERABLE, name: "Deliverable 01" }
    ]);

    // Auto-populate client if enquiry has one linked
    useEffect(() => {
        if (existingClientId) {
            console.log('✅ Pre-populating company from enquiry:', existingClientId);
            setClientId(existingClientId);
        }
    }, [existingClientId]);

    // Auto-populate deliverables from enquiry when dialog opens
    useEffect(() => {
        async function fetchEnquiryDeliverables() {
            if (!open || !enquiryId) return;

            try {
                const response = await fetch(`/api/enquiry/${enquiryId}`);
                if (!response.ok) throw new Error('Failed to fetch enquiry');

                const data = await response.json();

                // If enquiry has deliverables, populate them
                if (data.deliverables && data.deliverables.length > 0) {
                    console.log(`✅ Auto-populating ${data.deliverables.length} deliverable(s) from enquiry`);
                    const mappedDeliverables = data.deliverables.map((del: any, idx: number) => ({
                        name: del.name || `Deliverable ${String(idx + 1).padStart(2, '0')}`,
                        frameRate: del.frameRate || '25fps',
                        width: String(del.width || '1920'),
                        height: String(del.height || '1080'),
                        aspectRatio: del.aspectRatio || '16:9',
                        duration: del.duration || '30s',
                    }));
                    setDeliverables(mappedDeliverables);
                } else {
                    // Fallback to single default deliverable
                    setDeliverables([{ ...DEFAULT_DELIVERABLE, name: "Deliverable 01" }]);
                }
            } catch (error) {
                console.error('Failed to fetch enquiry deliverables:', error);
                // Keep default deliverable on error
                setDeliverables([{ ...DEFAULT_DELIVERABLE, name: "Deliverable 01" }]);
            }
        }

        fetchEnquiryDeliverables();
    }, [open, enquiryId]);

    function addDeliverable() {
        const nextNum = String(deliverables.length + 1).padStart(2, '0');
        setDeliverables([...deliverables, { ...DEFAULT_DELIVERABLE, name: `Deliverable ${nextNum}` }]);
    }

    function removeDeliverable(index: number) {
        if (deliverables.length > 1) {
            setDeliverables(deliverables.filter((_, i) => i !== index));
        }
    }

    function updateDeliverable(index: number, field: keyof Deliverable, value: string) {
        const updated = [...deliverables];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-calculate aspect ratio when dimensions change
        if (field === 'width' || field === 'height') {
            const w = parseInt(updated[index].width) || 0;
            const h = parseInt(updated[index].height) || 0;
            if (w > 0 && h > 0) {
                updated[index].aspectRatio = calculateAspectRatio(w, h);
            }
        }

        setDeliverables(updated);
    }

    async function handleSubmit() {
        if (!clientId || !projectTitle.trim()) {
            setError("Please select a client and enter a project title");
            return;
        }

        console.log('🚀 Converting enquiry to project with:', { enquiryId, clientId, contactId, projectTitle, deliverables });

        setLoading(true);
        setError(null);

        const result = await createProjectFromEnquiry(enquiryId, clientId, projectTitle, contactId, deliverables);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setOpen(false);
            setLoading(false);
            // Redirect to the new project
            if (result.projectId) {
                router.push(`/projects/${result.projectId}`);
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <FolderPlus className="w-4 h-4" />
                    Convert to Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Convert Enquiry to Project</DialogTitle>
                    <DialogDescription>
                        Select a client, set project details, and define deliverables.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <ClientSelector
                        value={clientId}
                        onValueChange={setClientId}
                        label="Client *"
                    />

                    <div className="grid gap-2">
                        <Label htmlFor="title">Project Title *</Label>
                        <Input
                            id="title"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            placeholder="Spring Campaign 2026"
                        />
                    </div>

                    {/* Deliverables Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Deliverables</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addDeliverable}>
                                <Plus className="w-4 h-4 mr-1" /> Add Deliverable
                            </Button>
                        </div>

                        {deliverables.map((deliverable, index) => (
                            <div key={index} className="p-3 border rounded-md bg-muted/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Input
                                        value={deliverable.name}
                                        onChange={(e) => updateDeliverable(index, 'name', e.target.value)}
                                        placeholder="Deliverable name"
                                        className="font-medium max-w-[200px]"
                                    />
                                    {deliverables.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeDeliverable(index)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Frame Rate</Label>
                                        <Input
                                            value={deliverable.frameRate}
                                            onChange={(e) => updateDeliverable(index, 'frameRate', e.target.value)}
                                            placeholder="25fps"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Width (px)</Label>
                                        <Input
                                            type="number"
                                            value={deliverable.width}
                                            onChange={(e) => updateDeliverable(index, 'width', e.target.value)}
                                            placeholder="1920"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Height (px)</Label>
                                        <Input
                                            type="number"
                                            value={deliverable.height}
                                            onChange={(e) => updateDeliverable(index, 'height', e.target.value)}
                                            placeholder="1080"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Ratio</Label>
                                        <Input
                                            value={deliverable.aspectRatio}
                                            onChange={(e) => updateDeliverable(index, 'aspectRatio', e.target.value)}
                                            placeholder="16:9"
                                            className="bg-muted"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Length</Label>
                                        <Input
                                            value={deliverable.duration}
                                            onChange={(e) => updateDeliverable(index, 'duration', e.target.value)}
                                            placeholder="30s"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !clientId || !projectTitle}>
                        {loading ? "Creating..." : "Create Project"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
