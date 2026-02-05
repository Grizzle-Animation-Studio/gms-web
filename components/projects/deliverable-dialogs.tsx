"use client";

import { useState } from "react";
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
import { createDeliverable, updateDeliverable, deleteDeliverable } from "@/app/actions/deliverable";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface DeliverableFormData {
    name: string;
    frameRate: string;
    width: string;
    height: string;
    aspectRatio: string;
    duration: string;
}

interface DeliverableType {
    id: string;
    name: string;
    frameRate: string | null;
    width: number | null;
    height: number | null;
    aspectRatio: string | null;
    duration: string | null;
}

function calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}

// Add New Deliverable Dialog
export function AddDeliverableDialog({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<DeliverableFormData>({
        name: "",
        frameRate: "25fps",
        width: "1920",
        height: "1080",
        aspectRatio: "16:9",
        duration: "30s"
    });

    function updateField(field: keyof DeliverableFormData, value: string) {
        const updated = { ...formData, [field]: value };

        // Auto-calculate aspect ratio
        if (field === 'width' || field === 'height') {
            const w = parseInt(updated.width) || 0;
            const h = parseInt(updated.height) || 0;
            if (w > 0 && h > 0) {
                updated.aspectRatio = calculateAspectRatio(w, h);
            }
        }

        setFormData(updated);
    }

    async function handleSubmit() {
        if (!formData.name.trim()) return;

        setLoading(true);
        const result = await createDeliverable(projectId, {
            name: formData.name,
            frameRate: formData.frameRate || null,
            width: parseInt(formData.width) || null,
            height: parseInt(formData.height) || null,
            aspectRatio: formData.aspectRatio || null,
            duration: formData.duration || null,
        });

        setLoading(false);
        if (result.success) {
            setOpen(false);
            setFormData({
                name: "",
                frameRate: "25fps",
                width: "1920",
                height: "1080",
                aspectRatio: "16:9",
                duration: "30s"
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Deliverable
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Deliverable</DialogTitle>
                    <DialogDescription>
                        Add a new output specification for this project.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label>Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="Deliverable 01"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Frame Rate</Label>
                            <Input
                                value={formData.frameRate}
                                onChange={(e) => updateField('frameRate', e.target.value)}
                                placeholder="25fps"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Length</Label>
                            <Input
                                value={formData.duration}
                                onChange={(e) => updateField('duration', e.target.value)}
                                placeholder="30s"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Width (px)</Label>
                            <Input
                                type="number"
                                value={formData.width}
                                onChange={(e) => updateField('width', e.target.value)}
                                placeholder="1920"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Height (px)</Label>
                            <Input
                                type="number"
                                value={formData.height}
                                onChange={(e) => updateField('height', e.target.value)}
                                placeholder="1080"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Ratio</Label>
                            <Input
                                value={formData.aspectRatio}
                                onChange={(e) => updateField('aspectRatio', e.target.value)}
                                placeholder="16:9"
                                className="bg-muted"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !formData.name.trim()}>
                        {loading ? "Adding..." : "Add Deliverable"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Edit Existing Deliverable Dialog
export function EditDeliverableDialog({ deliverable }: { deliverable: DeliverableType }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<DeliverableFormData>({
        name: deliverable.name,
        frameRate: deliverable.frameRate || "",
        width: deliverable.width?.toString() || "",
        height: deliverable.height?.toString() || "",
        aspectRatio: deliverable.aspectRatio || "",
        duration: deliverable.duration || ""
    });

    function updateField(field: keyof DeliverableFormData, value: string) {
        const updated = { ...formData, [field]: value };

        // Auto-calculate aspect ratio
        if (field === 'width' || field === 'height') {
            const w = parseInt(updated.width) || 0;
            const h = parseInt(updated.height) || 0;
            if (w > 0 && h > 0) {
                updated.aspectRatio = calculateAspectRatio(w, h);
            }
        }

        setFormData(updated);
    }

    async function handleSubmit() {
        if (!formData.name.trim()) return;

        setLoading(true);
        const result = await updateDeliverable(deliverable.id, {
            name: formData.name,
            frameRate: formData.frameRate || null,
            width: parseInt(formData.width) || null,
            height: parseInt(formData.height) || null,
            aspectRatio: formData.aspectRatio || null,
            duration: formData.duration || null,
        });

        setLoading(false);
        if (result.success) {
            setOpen(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this deliverable?")) return;

        setLoading(true);
        const result = await deleteDeliverable(deliverable.id);
        setLoading(false);
        if (result.success) {
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Deliverable</DialogTitle>
                    <DialogDescription>
                        Update the specification for this deliverable.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label>Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="Deliverable 01"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Frame Rate</Label>
                            <Input
                                value={formData.frameRate}
                                onChange={(e) => updateField('frameRate', e.target.value)}
                                placeholder="25fps"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Length</Label>
                            <Input
                                value={formData.duration}
                                onChange={(e) => updateField('duration', e.target.value)}
                                placeholder="30s"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Width (px)</Label>
                            <Input
                                type="number"
                                value={formData.width}
                                onChange={(e) => updateField('width', e.target.value)}
                                placeholder="1920"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Height (px)</Label>
                            <Input
                                type="number"
                                value={formData.height}
                                onChange={(e) => updateField('height', e.target.value)}
                                placeholder="1080"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Ratio</Label>
                            <Input
                                value={formData.aspectRatio}
                                onChange={(e) => updateField('aspectRatio', e.target.value)}
                                placeholder="16:9"
                                className="bg-muted"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex justify-between">
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading || !formData.name.trim()}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
