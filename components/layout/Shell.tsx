import { AppSidebar } from "@/components/layout/Sidebar";
import { DevRestartButton } from "@/components/dev/restart-button";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="container-wide py-8">
                    <div className="flex justify-end mb-4">
                        <DevRestartButton />
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
