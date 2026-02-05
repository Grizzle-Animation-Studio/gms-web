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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEnquiry, parseEnquiryWithAI } from "@/app/actions/enquiry";
import { findOrCreateContact } from "@/app/actions/contact";
import { uploadEnquiryAttachment } from "@/app/actions/enquiry-attachments";
import { ClientSelector } from "@/components/companies/company-combobox";
import { Sparkles, Loader2, Upload, X, Link as LinkIcon, Plus, Trash2, Globe } from "lucide-react";
import { LinkPreviewCard } from "@/components/ui/link-preview-card";

// Deliverable interface matching convert-dialog pattern
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

export function NewEnquiryDialog() {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState("");
    const [clientId, setClientId] = useState<string | undefined>();
    const [contactId, setContactId] = useState<string | undefined>();

    // AI-extracted contact fields
    const [contactFirstName, setContactFirstName] = useState("");
    const [contactLastName, setContactLastName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [contactJobTitle, setContactJobTitle] = useState("");

    // Project fields
    const [projectTitle, setProjectTitle] = useState("");
    const [projectSummary, setProjectSummary] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [budgetMin, setBudgetMin] = useState("");
    const [budgetMax, setBudgetMax] = useState("");
    const [timeline, setTimeline] = useState("");
    const [companyName, setCompanyName] = useState("");  // Store parsed company name
    const [companyWebsite, setCompanyWebsite] = useState("");  // Inferred website URL

    // NEW: Job details fields
    const [tone, setTone] = useState("");
    const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

    // File uploads
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parseMessage, setParseMessage] = useState<string | null>(null);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            // Clear all fields
            setContent("");
            setClientId(undefined);
            setContactId(undefined);
            setContactFirstName("");
            setContactLastName("");
            setContactEmail("");
            setContactPhone("");
            setContactJobTitle("");
            setProjectTitle("");
            setProjectDescription("");
            setBudgetMin("");
            setBudgetMax("");
            setTimeline("");
            setCompanyName("");
            setCompanyWebsite("");
            setTone("");
            setReferenceLinks([]);
            setDeliverables([]);
            setUploadedFiles([]);
            setError(null);
            setParseMessage(null);
        }
    }, [open]);

    // Deliverable management functions
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

    async function handleParseWithAI() {
        if (!content.trim()) {
            setError("Please enter enquiry content first");
            return;
        }

        setParsing(true);
        setError(null);
        setParseMessage(null);

        const result = await parseEnquiryWithAI(content);

        setParsing(false);

        if (result.error) {
            setError(result.error);
        } else if (result.success && result.parsed) {
            console.log('\ud83c\udfaf AI Parse Result:', result.parsed);

            // Auto-fill project fields
            setProjectTitle(result.parsed.projectTitle || "");
            setProjectSummary(result.parsed.projectSummary || "");
            setProjectDescription(result.parsed.projectDescription || "");

            console.log('\ud83d\udccb Setting projectTitle to:', result.parsed.projectTitle);

            // Parse budget into min/max if it's a range
            const budgetStr = result.parsed.budget || "";
            if (budgetStr.includes('-') || budgetStr.toLowerCase().includes('to')) {
                // Extract range (e.g., "$10k - $15k" or "10000 to 15000")
                const parts = budgetStr.split(/[-–—]|to/i).map(p => p.trim());
                if (parts.length === 2) {
                    setBudgetMin(parts[0]);
                    setBudgetMax(parts[1]);
                } else {
                    setBudgetMin(budgetStr);
                }
            } else {
                setBudgetMin(budgetStr);
            }

            setTimeline(result.parsed.timeline || "");
            setCompanyName(result.parsed.clientName || "");  // Store company name
            setCompanyWebsite(result.parsed.companyWebsite || "");  // Store inferred website

            // NEW: Auto-fill job details
            setTone(result.parsed.tone || "");
            setReferenceLinks(result.parsed.referenceLinks || []);

            // Use parsed deliverables array if available, otherwise fallback to legacy method
            if (result.parsed.deliverables && result.parsed.deliverables.length > 0) {
                // Map parsed deliverables to our Deliverable format
                const mappedDeliverables: Deliverable[] = result.parsed.deliverables.map((d, i) => ({
                    name: d.name || `Deliverable ${String(i + 1).padStart(2, '0')}`,
                    frameRate: result.parsed.framerate || '25fps',
                    width: d.aspectRatio === '9:16' ? '1080' : '1920',
                    height: d.aspectRatio === '9:16' ? '1920' : '1080',
                    aspectRatio: d.aspectRatio || '16:9',
                    duration: d.duration || '',
                }));
                setDeliverables(mappedDeliverables);
            } else {
                // Legacy fallback: use numberOfDeliverables count
                const numDeliverables = result.parsed.numberOfDeliverables || 0;
                const parsedDeliverables: Deliverable[] = [];
                for (let i = 0; i < numDeliverables; i++) {
                    parsedDeliverables.push({
                        ...DEFAULT_DELIVERABLE,
                        name: `Deliverable ${String(i + 1).padStart(2, '0')}`,
                        frameRate: result.parsed.framerate || '25fps',
                        aspectRatio: result.parsed.aspectRatio || '16:9',
                    });
                }
                setDeliverables(parsedDeliverables);
            }

            // Auto-fill contact fields
            setContactFirstName(result.parsed.contactFirstName || "");
            setContactLastName(result.parsed.contactLastName || "");
            setContactEmail(result.parsed.contactEmail || "");
            setContactPhone(result.parsed.contactPhone || "");
            setContactJobTitle(result.parsed.contactJobTitle || "");

            console.log('🔍 AI Parsing Result:', {
                companyCandidates: result.companyCandidates,
                suggestedCompany: result.suggestedCompany,
                parsed: result.parsed
            });

            // NEW: Handle company candidates
            if (result.companyCandidates && result.companyCandidates.length > 0) {
                const topMatch = result.companyCandidates[0];

                // If top match has high confidence (>90%), auto-select it
                if (topMatch.matchScore >= 0.9) {
                    console.log('✅ Auto-selecting high-confidence match:', topMatch.name);
                    setClientId(topMatch.id);
                    setParseMessage(
                        `✨ Parsed successfully! Matched with "${topMatch.name}" (${Math.round(topMatch.matchScore * 100)}% confidence, ${topMatch.existingContacts} contacts).`
                    );
                } else {
                    // Show candidates for manual selection
                    console.log(`📋 ${result.companyCandidates.length} candidates found, top match:`, topMatch.name, `(${Math.round(topMatch.matchScore * 100)}%)`);

                    // Auto-select the top match but inform user about other options
                    setClientId(topMatch.id);

                    const otherMatches = result.companyCandidates.slice(1, 3).map(c =>
                        `${c.name} (${Math.round(c.matchScore * 100)}%)`
                    ).join(', ');

                    setParseMessage(
                        `✨ Parsed! Best match: "${topMatch.name}" (${Math.round(topMatch.matchScore * 100)}%)` +
                        (otherMatches ? `. Other options: ${otherMatches}. Use the selector below to change.` : '')
                    );
                }
            } else {
                // No matches found - user will need to create new or select manually
                console.log('⚠️ No company matches found for:', result.parsed.clientName);
                setParseMessage(
                    `✨ Parsed successfully! No existing company matches "${result.parsed.clientName}". ` +
                    `Please select an existing company or it will be created as new.`
                );
            }
        }
    }

    async function handleSubmit() {
        if (!content.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // NEW: No longer require company selection - will auto-create if needed
            let finalClientId = clientId;

            // If we have contact info and a client, create/find the contact first
            let finalContactId = contactId;
            if (contactFirstName && finalClientId && !contactId) {
                const contactResult = await findOrCreateContact(finalClientId, {
                    firstName: contactFirstName,
                    lastName: contactLastName || null,
                    email: contactEmail || null,
                    phone: contactPhone || null,
                    jobTitle: contactJobTitle || null,
                });

                if (contactResult.success && contactResult.contact) {
                    finalContactId = contactResult.contact.id;
                }
            }

            console.log('📋 Creating enquiry with:', { finalClientId, finalContactId, projectTitle, companyName });

            const result = await createEnquiry(
                content,
                finalClientId,
                finalContactId,
                projectTitle,
                projectSummary,
                projectDescription,
                undefined,  // legacy budget field
                budgetMin,
                budgetMax,
                timeline,
                companyName,  // Pass company name for auto-creation
                companyWebsite,  // Pass inferred website
                // LEGACY: Extract from first deliverable for backward compatibility
                deliverables[0]?.frameRate || undefined,
                deliverables[0]?.aspectRatio || undefined,
                tone,
                JSON.stringify(referenceLinks),  // Convert array to JSON string
                deliverables.length || undefined,  // Number of deliverables
                deliverables  // NEW: Pass full deliverables array
            );

            setLoading(false);

            if (result.error) {
                setError(result.error);
            } else if (result.enquiry) {
                // Upload any attached files
                if (uploadedFiles.length > 0) {
                    for (const file of uploadedFiles) {
                        const formData = new FormData();
                        formData.append("enquiryId", result.enquiry.id);
                        formData.append("file", file);
                        await uploadEnquiryAttachment(formData);
                    }
                }
                setOpen(false);
                // Form will auto-reset via useEffect when dialog closes
            }
        } catch (err) {
            setLoading(false);
            setError("Failed to create enquiry");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>New Enquiry</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Enquiry</DialogTitle>
                    <DialogDescription>
                        Paste the raw enquiry email or message here. Use AI to automatically extract details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enquiry-content">Enquiry Content *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleParseWithAI}
                                disabled={parsing || !content.trim()}
                            >
                                {parsing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Parsing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Parse with AI
                                    </>
                                )}
                            </Button>
                        </div>
                        <textarea
                            id="enquiry-content"
                            className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Hi there, we'd like to commission a..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {parseMessage && (
                        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                            <p className="text-sm text-green-800 dark:text-green-200">{parseMessage}</p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="project-title">Project Title</Label>
                        <Input
                            id="project-title"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            placeholder="e.g., Website Redesign for ABC Corp"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="project-summary">Project Summary</Label>
                        <Textarea
                            id="project-summary"
                            rows={2}
                            placeholder="Brief 1-2 sentence overview"
                            value={projectSummary}
                            onChange={(e) => setProjectSummary(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="project-description">Project Description (Detailed)</Label>
                        <textarea
                            id="project-description"
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                            placeholder="Comprehensive description with all project details, requirements, and context"
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="budget-min">Budget Min</Label>
                            <Input
                                id="budget-min"
                                value={budgetMin}
                                onChange={(e) => setBudgetMin(e.target.value)}
                                placeholder="e.g., $10,000"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="budget-max">Budget Max</Label>
                            <Input
                                id="budget-max"
                                value={budgetMax}
                                onChange={(e) => setBudgetMax(e.target.value)}
                                placeholder="e.g., $15,000"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="timeline">Timeline/Deadline</Label>
                        <Input
                            id="timeline"
                            value={timeline}
                            onChange={(e) => setTimeline(e.target.value)}
                            placeholder="e.g., End of Q2"
                        />
                    </div>

                    {/* Job Details Section */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <Label className="text-base font-semibold">Job Specifications</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addDeliverable}>
                                <Plus className="w-4 h-4 mr-1" /> Add Deliverable
                            </Button>
                        </div>

                        {/* Tone/Style */}
                        <div className="grid gap-2 mb-4">
                            <Label htmlFor="tone">Tone/Style</Label>
                            <Input
                                id="tone"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                placeholder="e.g., Corporate, Energetic, Minimal"
                            />
                        </div>

                        {/* Deliverables Cards */}
                        <div className="space-y-3">
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
                            {deliverables.length === 0 && (
                                <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="text-sm font-medium">No deliverables defined. Add at least one to proceed.</span>
                                </div>
                            )}
                        </div>

                        {referenceLinks.length > 0 && (
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4" />
                                    Reference Links ({referenceLinks.length})
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {referenceLinks.map((link, index) => (
                                        <LinkPreviewCard key={index} url={link} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <ClientSelector
                        value={clientId}
                        onValueChange={setClientId}
                        label="Link to Client (Optional)"
                    />

                    {/* Company Website (Inferred) */}
                    {companyWebsite && (
                        <div className="grid gap-2">
                            <Label htmlFor="company-website" className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                Company Website (Inferred)
                            </Label>
                            <Input
                                id="company-website"
                                value={companyWebsite}
                                onChange={(e) => setCompanyWebsite(e.target.value)}
                                placeholder="www.example.com"
                            />
                            <p className="text-xs text-muted-foreground">
                                Inferred from email domain. Edit if incorrect.
                            </p>
                        </div>
                    )}

                    {/* Contact Information */}
                    {(contactFirstName || contactEmail || contactPhone) && (
                        <div className="border-t pt-4">
                            <Label className="text-base font-semibold mb-2 block">Contact Information (Extracted)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="contact-first-name">First Name</Label>
                                    <Input
                                        id="contact-first-name"
                                        value={contactFirstName}
                                        onChange={(e) => setContactFirstName(e.target.value)}
                                        placeholder="First name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact-last-name">Last Name</Label>
                                    <Input
                                        id="contact-last-name"
                                        value={contactLastName}
                                        onChange={(e) => setContactLastName(e.target.value)}
                                        placeholder="Last name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact-email">Email</Label>
                                    <Input
                                        id="contact-email"
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact-phone">Phone</Label>
                                    <Input
                                        id="contact-phone"
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div className="grid gap-2 col-span-2">
                                    <Label htmlFor="contact-job-title">Job Title</Label>
                                    <Input
                                        id="contact-job-title"
                                        value={contactJobTitle}
                                        onChange={(e) => setContactJobTitle(e.target.value)}
                                        placeholder="e.g., Marketing Manager"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* File Upload Section */}
                    <div className="grid gap-2">
                        <Label>Attachments (Optional)</Label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                    className="cursor-pointer"
                                />
                            </div>
                            {uploadedFiles.length > 0 && (
                                <div className="space-y-1">
                                    {uploadedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                                            <span className="truncate flex-1">{file.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
                        {loading ? "Adding..." : "Add Enquiry"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
