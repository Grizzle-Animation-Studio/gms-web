"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { updateCompany } from "@/app/actions/company";
import { useRouter } from "next/navigation";

type Company = {
    id: string;
    name: string;
    companyEmail: string | null;
    companyPhone: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    abn: string | null;
};

export function EditCompanyDialog({ company }: { company: Company }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            companyEmail: formData.get("companyEmail") as string || undefined,
            companyPhone: formData.get("companyPhone") as string || undefined,
            street: formData.get("street") as string || undefined,
            city: formData.get("city") as string || undefined,
            state: formData.get("state") as string || undefined,
            postcode: formData.get("postcode") as string || undefined,
            abn: formData.get("abn") as string || undefined,
        };

        const result = await updateCompany(company.id, data);
        setLoading(false);

        if (result.error) {
            alert(result.error);
        } else {
            setOpen(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Company
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Company</DialogTitle>
                        <DialogDescription>
                            Update company information
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Company Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={company.name}
                                placeholder="Acme Corporation"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={company.companyEmail || ""}
                                    placeholder="contact@acme.com"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    defaultValue={company.companyPhone || ""}
                                    placeholder="0400 000 000"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="street">Street Address</Label>
                            <Input
                                id="street"
                                name="street"
                                defaultValue={company.street || ""}
                                placeholder="123 Main Street"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    defaultValue={company.city || ""}
                                    placeholder="Sydney"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    name="state"
                                    defaultValue={company.state || ""}
                                    placeholder="NSW"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="postcode">Postcode</Label>
                                <Input
                                    id="postcode"
                                    name="postcode"
                                    defaultValue={company.postcode || ""}
                                    placeholder="2000"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="abn">ABN</Label>
                            <Input
                                id="abn"
                                name="abn"
                                defaultValue={company.abn || ""}
                                placeholder="12 345 678 901"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
