"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Plus,
    Trash2,
    Pencil,
    Star,
    GripVertical,
    Building2,
    User,
    Loader2,
    CheckCircle2
} from "lucide-react";
import {
    createChecklistTemplate,
    updateChecklistTemplate,
    deleteChecklistTemplate,
    addTemplateItem,
    updateTemplateItem,
    deleteTemplateItem
} from "@/app/actions/checklist";

type TemplateItem = {
    id: string;
    title: string;
    description: string | null;
    required: boolean;
    defaultOwner: string;
    sortOrder: number;
};

type Template = {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    items: TemplateItem[];
};

interface ChecklistTemplatesManagerProps {
    templates: Template[];
}

export function ChecklistTemplatesManager({ templates: initialTemplates }: ChecklistTemplatesManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [templates, setTemplates] = useState(initialTemplates);

    // New template dialog state
    const [newTemplateOpen, setNewTemplateOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [newTemplateDesc, setNewTemplateDesc] = useState("");
    const [newTemplateDefault, setNewTemplateDefault] = useState(false);

    // Edit template dialog state
    const [editTemplateOpen, setEditTemplateOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [editTemplateName, setEditTemplateName] = useState("");
    const [editTemplateDesc, setEditTemplateDesc] = useState("");
    const [editTemplateDefault, setEditTemplateDefault] = useState(false);

    // New item dialog state
    const [newItemOpen, setNewItemOpen] = useState(false);
    const [newItemTemplateId, setNewItemTemplateId] = useState<string | null>(null);
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemDesc, setNewItemDesc] = useState("");
    const [newItemRequired, setNewItemRequired] = useState(true);
    const [newItemOwner, setNewItemOwner] = useState("grizzle");

    // Edit item dialog state
    const [editItemOpen, setEditItemOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);
    const [editItemTitle, setEditItemTitle] = useState("");
    const [editItemDesc, setEditItemDesc] = useState("");
    const [editItemRequired, setEditItemRequired] = useState(true);
    const [editItemOwner, setEditItemOwner] = useState("grizzle");

    function handleCreateTemplate() {
        if (!newTemplateName.trim()) return;

        startTransition(async () => {
            await createChecklistTemplate(newTemplateName, newTemplateDesc || undefined, newTemplateDefault);
            setNewTemplateOpen(false);
            setNewTemplateName("");
            setNewTemplateDesc("");
            setNewTemplateDefault(false);
            // Page will revalidate
        });
    }

    function openEditTemplate(template: Template) {
        setEditingTemplate(template);
        setEditTemplateName(template.name);
        setEditTemplateDesc(template.description || "");
        setEditTemplateDefault(template.isDefault);
        setEditTemplateOpen(true);
    }

    function handleUpdateTemplate() {
        if (!editingTemplate || !editTemplateName.trim()) return;

        startTransition(async () => {
            await updateChecklistTemplate(editingTemplate.id, {
                name: editTemplateName,
                description: editTemplateDesc || undefined,
                isDefault: editTemplateDefault
            });
            setEditTemplateOpen(false);
            setEditingTemplate(null);
        });
    }

    function handleDeleteTemplate(templateId: string) {
        startTransition(async () => {
            await deleteChecklistTemplate(templateId);
        });
    }

    function openAddItem(templateId: string) {
        setNewItemTemplateId(templateId);
        setNewItemTitle("");
        setNewItemDesc("");
        setNewItemRequired(true);
        setNewItemOwner("grizzle");
        setNewItemOpen(true);
    }

    function handleAddItem() {
        if (!newItemTemplateId || !newItemTitle.trim()) return;

        startTransition(async () => {
            await addTemplateItem(
                newItemTemplateId,
                newItemTitle,
                newItemDesc || undefined,
                newItemRequired,
                newItemOwner
            );
            setNewItemOpen(false);
            setNewItemTemplateId(null);
        });
    }

    function openEditItem(item: TemplateItem) {
        setEditingItem(item);
        setEditItemTitle(item.title);
        setEditItemDesc(item.description || "");
        setEditItemRequired(item.required);
        setEditItemOwner(item.defaultOwner);
        setEditItemOpen(true);
    }

    function handleUpdateItem() {
        if (!editingItem || !editItemTitle.trim()) return;

        startTransition(async () => {
            await updateTemplateItem(editingItem.id, {
                title: editItemTitle,
                description: editItemDesc || undefined,
                required: editItemRequired,
                defaultOwner: editItemOwner
            });
            setEditItemOpen(false);
            setEditingItem(null);
        });
    }

    function handleDeleteItem(itemId: string) {
        startTransition(async () => {
            await deleteTemplateItem(itemId);
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Checklist Templates</CardTitle>
                        <CardDescription>
                            Create reusable checklists for project onboarding
                        </CardDescription>
                    </div>
                    <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Checklist Template</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="template-name">Template Name</Label>
                                    <Input
                                        id="template-name"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder="e.g., Standard Project Onboarding"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="template-desc">Description (optional)</Label>
                                    <Textarea
                                        id="template-desc"
                                        value={newTemplateDesc}
                                        onChange={(e) => setNewTemplateDesc(e.target.value)}
                                        placeholder="Brief description of when to use this template..."
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="template-default"
                                        checked={newTemplateDefault}
                                        onCheckedChange={setNewTemplateDefault}
                                    />
                                    <Label htmlFor="template-default">Set as default for new projects</Label>
                                </div>
                                <Button onClick={handleCreateTemplate} disabled={isPending || !newTemplateName.trim()}>
                                    {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Create Template
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent>
                {templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No templates yet. Create your first checklist template.</p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full">
                        {templates.map((template) => (
                            <AccordionItem key={template.id} value={template.id}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-3 flex-1 text-left">
                                        <span className="font-medium">{template.name}</span>
                                        {template.isDefault && (
                                            <Badge variant="secondary" className="gap-1">
                                                <Star className="h-3 w-3 fill-current" />
                                                Default
                                            </Badge>
                                        )}
                                        <Badge variant="outline">
                                            {template.items.length} item{template.items.length !== 1 ? "s" : ""}
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-2 space-y-4">
                                        {template.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {template.description}
                                            </p>
                                        )}

                                        {/* Template Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditTemplate(template)}
                                            >
                                                <Pencil className="h-4 w-4 mr-1" />
                                                Edit Template
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openAddItem(template.id)}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Item
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-destructive">
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete "{template.name}" and all its items.
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>

                                        {/* Items List */}
                                        {template.items.length > 0 ? (
                                            <div className="border rounded-md divide-y">
                                                {template.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center gap-3 p-3 group"
                                                    >
                                                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{item.title}</span>
                                                                {item.required && (
                                                                    <Badge variant="outline" className="text-xs">Required</Badge>
                                                                )}
                                                                <Badge variant="secondary" className="text-xs gap-1">
                                                                    {item.defaultOwner === "client" ? (
                                                                        <User className="h-3 w-3" />
                                                                    ) : (
                                                                        <Building2 className="h-3 w-3" />
                                                                    )}
                                                                    {item.defaultOwner === "client" ? "Client" : "Grizzle"}
                                                                </Badge>
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => openEditItem(item)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Remove "{item.title}" from this template?
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteItem(item.id)}
                                                                            className="bg-destructive text-destructive-foreground"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-muted-foreground border rounded-md bg-muted/20">
                                                <p className="text-sm">No items in this template yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>

            {/* Edit Template Dialog */}
            <Dialog open={editTemplateOpen} onOpenChange={setEditTemplateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Template</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-template-name">Template Name</Label>
                            <Input
                                id="edit-template-name"
                                value={editTemplateName}
                                onChange={(e) => setEditTemplateName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-template-desc">Description</Label>
                            <Textarea
                                id="edit-template-desc"
                                value={editTemplateDesc}
                                onChange={(e) => setEditTemplateDesc(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="edit-template-default"
                                checked={editTemplateDefault}
                                onCheckedChange={setEditTemplateDefault}
                            />
                            <Label htmlFor="edit-template-default">Set as default</Label>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditTemplateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateTemplate} disabled={isPending || !editTemplateName.trim()}>
                                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Item Dialog */}
            <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Checklist Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="item-title">Item Title</Label>
                            <Input
                                id="item-title"
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                placeholder="e.g., Contract signed"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="item-desc">Description (optional)</Label>
                            <Textarea
                                id="item-desc"
                                value={newItemDesc}
                                onChange={(e) => setNewItemDesc(e.target.value)}
                                placeholder="Additional details or instructions..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Default Owner</Label>
                                <Select value={newItemOwner} onValueChange={setNewItemOwner}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="grizzle">
                                            <span className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Grizzle
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="client">
                                            <span className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Client
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Required?</Label>
                                <div className="flex items-center h-10">
                                    <Switch
                                        checked={newItemRequired}
                                        onCheckedChange={setNewItemRequired}
                                    />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        {newItemRequired ? "Must complete" : "Optional"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleAddItem} disabled={isPending || !newItemTitle.trim()}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Add Item
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Item Dialog */}
            <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Checklist Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-item-title">Item Title</Label>
                            <Input
                                id="edit-item-title"
                                value={editItemTitle}
                                onChange={(e) => setEditItemTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-item-desc">Description</Label>
                            <Textarea
                                id="edit-item-desc"
                                value={editItemDesc}
                                onChange={(e) => setEditItemDesc(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Default Owner</Label>
                                <Select value={editItemOwner} onValueChange={setEditItemOwner}>
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
                                <div className="flex items-center h-10">
                                    <Switch
                                        checked={editItemRequired}
                                        onCheckedChange={setEditItemRequired}
                                    />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        {editItemRequired ? "Must complete" : "Optional"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditItemOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateItem} disabled={isPending || !editItemTitle.trim()}>
                                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
