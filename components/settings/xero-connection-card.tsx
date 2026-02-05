"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getXeroStatus, syncContactsFromXero, disconnectXero, clearSyncedClients } from "@/app/actions/xero";
import { CheckCircle2, XCircle, RefreshCw, Link as LinkIcon, Unlink, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function XeroConnectionCard() {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        checkStatus();

        // Check for connection success/error from URL params
        if (searchParams.get('xero') === 'connected') {
            setSyncResult({ success: true, message: "Successfully connected to Xero!" });
            setTimeout(() => router.replace('/settings'), 3000);
        }

        const error = searchParams.get('error');
        if (error) {
            setSyncResult({ error: decodeURIComponent(error) });
        }
    }, [searchParams]);

    async function checkStatus() {
        setLoading(true);
        const status = await getXeroStatus();
        setConnected(status.connected);
        setLoading(false);
    }

    async function handleConnect() {
        window.location.href = '/api/xero/auth';
    }

    async function handleSync() {
        setSyncing(true);
        setSyncResult(null);
        const result = await syncContactsFromXero();
        setSyncing(false);
        setSyncResult(result);

        if (result.success) {
            setTimeout(() => setSyncResult(null), 5000);
        }
    }

    async function handleClear() {
        if (!confirm("Are you sure you want to delete all Xero-synced clients? This cannot be undone.")) return;

        setClearing(true);
        setSyncResult(null);
        const result = await clearSyncedClients();
        setClearing(false);

        if (result.success) {
            setSyncResult({ success: true, message: `Deleted ${result.deleted} synced clients` });
            setTimeout(() => setSyncResult(null), 3000);
        } else {
            setSyncResult(result);
        }
    }

    async function handleDisconnect() {
        if (!confirm("Are you sure you want to disconnect from Xero?")) return;

        const result = await disconnectXero();
        if (result.success) {
            setConnected(false);
            setSyncResult({ success: true, message: "Disconnected from Xero" });
            setTimeout(() => setSyncResult(null), 3000);
        } else {
            setSyncResult(result);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Xero Integration</CardTitle>
                    <CardDescription>Loading...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Xero Integration
                            {connected ? (
                                <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Connected
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Not Connected
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Sync contacts between Grizzle Master System and Xero
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {syncResult && (
                    <div className={`p-4 rounded-md ${syncResult.error
                        ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                        : 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                        }`}>
                        <p className={`text-sm font-medium ${syncResult.error ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'
                            }`}>
                            {syncResult.error || syncResult.message || `
                                Successfully synced! 
                                Created: ${syncResult.created}, 
                                Updated: ${syncResult.updated}, 
                                Matched: ${syncResult.matched} 
                                (Total: ${syncResult.total})
                            `}
                        </p>
                    </div>
                )}

                {!connected ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Connect to Xero to automatically sync your contacts and client information.
                        </p>
                        <Button onClick={handleConnect} className="gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Connect to Xero
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Your Xero account is connected. You can now sync contacts.
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={handleSync} disabled={syncing} className="gap-2">
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Syncing...' : 'Sync Contacts Now'}
                            </Button>
                            <Button onClick={handleClear} disabled={clearing} variant="outline" className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                {clearing ? 'Clearing...' : 'Clear Synced'}
                            </Button>
                            <Button onClick={handleDisconnect} variant="outline" className="gap-2">
                                <Unlink className="w-4 h-4" />
                                Disconnect
                            </Button>
                        </div>
                        <div className="p-4 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-2">What happens when you sync?</p>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Imports all contacts from Xero</li>
                                <li>Matches existing GMS clients by name</li>
                                <li>Creates new clients for unmatched Xero contacts</li>
                                <li>Updates synced clients with latest Xero data</li>
                            </ul>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
