"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCompany } from "@/app/actions/company";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteCompanyButton({ companyId, hasProjects }: { companyId: string; hasProjects: boolean }) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        setLoading(true);
        const result = await deleteCompany(companyId);
        setLoading(false);

        if (result.error) {
            alert(result.error);
        } else {
            setOpen(false);
            router.push("/companies");
        }
    }

    if (hasProjects) {
        return (
            <Button variant="destructive" disabled title="Cannot delete company with active projects">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Company
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" onClick={(e) => e.stopPropagation()}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete this company
                        from the database.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? "Deleting..." : "Delete Company"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
