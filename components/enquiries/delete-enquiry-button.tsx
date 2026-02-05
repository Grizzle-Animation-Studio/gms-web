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
import { Trash2 } from "lucide-react";
import { deleteEnquiry } from "@/app/actions/enquiry";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteEnquiryButton({ enquiryId, hasProject }: { enquiryId: string; hasProject: boolean }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        setLoading(true);
        const result = await deleteEnquiry(enquiryId);
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Enquiry deleted successfully");
            router.push("/enquiries");
        }
    }

    if (hasProject) {
        return (
            <Button
                variant="ghost"
                size="sm"
                disabled
                title="Cannot delete enquiry that has been converted to a project"
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Enquiry?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete this enquiry
                        from the database.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? "Deleting..." : "Delete Enquiry"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
