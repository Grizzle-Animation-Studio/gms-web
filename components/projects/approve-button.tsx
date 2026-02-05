"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveProject } from "@/app/actions/project";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ApproveProjectButton({ projectId }: { projectId: string }) {
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const router = useRouter();

    async function handleApprove() {
        // User requested removal of manual confirm for automation
        // if (!confirm("...")) return;

        setLoading(true);
        const result = await approveProject(projectId);
        setLoading(false);

        if ('error' in result && result.error) {
            setDebugInfo({ error: result.error }); // Show error in debug block
            alert(result.error);
        } else {
            setDebugInfo(result.debug);
            console.log("[Dropbox Client Debug]", result.debug);
            router.refresh();
        }
    }

    return (
        <div className="flex flex-col gap-2 items-end">
            <Button onClick={handleApprove} disabled={loading}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {loading ? "Approving..." : "Approve Project"}
            </Button>
            {debugInfo && (
                <div className="p-4 bg-slate-950 text-slate-50 rounded-md max-w-lg overflow-auto border border-slate-800 shadow-xl relative z-50">
                    <p className="font-bold mb-2 text-green-400">Dropbox Response:</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
