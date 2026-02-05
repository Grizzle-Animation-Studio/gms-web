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
import { Label } from "@/components/ui/label";
import { updateEnquiry } from "@/app/actions/enquiry";
import { ClientSelector } from "@/components/companies/company-combobox";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

type EnquiryData = {
    id: string;
    rawContent: string;
    clientId: string | null;
};

export function EditEnquiryDialog({ enquiry }: { enquiry: EnquiryData }) {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState(enquiry.rawContent);
    const [clientId, setClientId] = useState<string | undefined>(enquiry.clientId || undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit() {
        if (!content.trim()) {
            setError("Content cannot be empty");
            return;
        }

        setLoading(true);
        setError(null);

        const result = await updateEnquiry(enquiry.id, {
            rawContent: content,
            companyId: clientId || null,
        });

        setLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setOpen(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Enquiry</DialogTitle>
                    <DialogDescription>
                        Update the enquiry content or link/change the client.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-enquiry-content">Enquiry Content</Label>
                        <textarea
                            id="edit-enquiry-content"
                            className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Hi there, we'd like to commission a..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <ClientSelector
                        value={clientId}
                        onValueChange={setClientId}
                        label="Link to Client (Optional)"
                    />

                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
