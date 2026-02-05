import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XeroConnectionCard } from "@/components/settings/xero-connection-card";
import { ChecklistTemplatesManager } from "@/components/settings/checklist-templates-manager";
import { getChecklistTemplates } from "@/app/actions/checklist";

export default async function SettingsPage() {
    // Fetch checklist templates with their items
    const templates = await getChecklistTemplates();

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your integrations and system preferences
                    </p>
                </div>

                {/* Checklist Templates */}
                <ChecklistTemplatesManager templates={templates} />

                {/* Xero Integration */}
                <XeroConnectionCard />

                {/* Other Settings (Future) */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>
                            Additional system preferences coming soon
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            More settings will be added as the system grows.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
