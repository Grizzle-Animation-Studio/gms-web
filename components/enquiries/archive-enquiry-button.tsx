"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { archiveEnquiry } from "@/app/actions/enquiry";
import { useRouter } from "next/navigation";

export function ArchiveEnquiryButton({ enquiryId }: { enquiryId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleArchive() {
        setLoading(true);
        const result = await archiveEnquiry(enquiryId);
        setLoading(false);

        if (result.error) {
            alert(result.error);
        } else {
            router.refresh();
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            disabled={loading}
            title="Archive this enquiry"
        >
            <Archive className="w-4 h-4 mr-2" />
            {loading ? "Archiving..." : "Archive"}
        </Button>
    );
}
