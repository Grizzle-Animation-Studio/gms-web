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
import { ClientSelector } from "@/components/companies/company-combobox";
import { UserCog } from "lucide-react";
import { updateProjectCompany } from "@/app/actions/project";
import { useRouter } from "next/navigation";

export function ChangeClientDialog({
    projectId,
    currentClientId
}: {
    projectId: string;
    currentClientId: string;
}) {
    const [open, setOpen] = useState(false);
    const [clientId, setClientId] = useState<string | undefined>(currentClientId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit() {
        if (!clientId) {
            setError("Please select a client");
            return;
        }

        setLoading(true);
        setError(null);

        const result = await updateProjectCompany(projectId, clientId);

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
                    <UserCog className="w-4 h-4 mr-2" />
                    Change Client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Change Project Client</DialogTitle>
                    <DialogDescription>
                        Select a different client for this project.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <ClientSelector
                        value={clientId}
                        onValueChange={setClientId}
                        label="Client *"
                    />
                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !clientId}>
                        {loading ? "Updating..." : "Update Client"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
