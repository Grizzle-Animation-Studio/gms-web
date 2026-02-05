"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DevRestartButton() {
    const [restarting, setRestarting] = useState(false);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const handleRestart = async () => {
        setRestarting(true);

        try {
            const response = await fetch('/api/dev/restart', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Server stopped', {
                    description: 'Please restart manually: npm run dev'
                });
                setRestarting(false);
            } else {
                toast.error('Stop failed', {
                    description: data.error || 'Unknown error'
                });
                setRestarting(false);
            }
        } catch (error) {
            toast.error('Stop failed', {
                description: error instanceof Error ? error.message : 'Network error'
            });
            setRestarting(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            disabled={restarting}
            title="Kill dev server (Dev Mode)"
        >
            {restarting ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Stopping...
                </>
            ) : (
                <>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Kill Server
                </>
            )}
        </Button>
    );
}
