"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Play } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface StartProductionButtonProps {
    projectId: string;
    canStart: boolean;
    pendingItems: { id: string; title: string }[];
    requiredCount: number;
    completedCount: number;
    onStartProduction?: () => Promise<void>;
}

export function StartProductionButton({
    projectId,
    canStart,
    pendingItems,
    requiredCount,
    completedCount,
    onStartProduction
}: StartProductionButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);

    function handleClick() {
        if (canStart) {
            setConfirmOpen(true);
        } else {
            setBlockDialogOpen(true);
        }
    }

    function handleConfirm() {
        startTransition(async () => {
            if (onStartProduction) {
                await onStartProduction();
            }
            setConfirmOpen(false);
        });
    }

    return (
        <>
            <Button
                onClick={handleClick}
                disabled={isPending}
                variant={canStart ? "default" : "outline"}
                className={canStart ? "bg-green-600 hover:bg-green-700" : ""}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : canStart ? (
                    <Play className="h-4 w-4 mr-2" />
                ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Start Production
            </Button>

            {/* Confirm dialog when ready */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Production?</DialogTitle>
                        <DialogDescription>
                            All {requiredCount} required checklist items are complete.
                            This will mark the project as in production.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Start Production
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Block dialog when not ready */}
            <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Cannot Start Production
                        </DialogTitle>
                        <DialogDescription>
                            {pendingItems.length} required checklist item(s) are not yet complete:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <ul className="space-y-2">
                            {pendingItems.map(item => (
                                <li key={item.id} className="flex items-center gap-2 text-sm">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    {item.title}
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-muted-foreground mt-4">
                            Complete or waive these items to proceed.
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={() => setBlockDialogOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
