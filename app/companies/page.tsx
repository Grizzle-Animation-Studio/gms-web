import { AppShell } from "@/components/layout/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { getAllCompanies } from "@/app/actions/company";
import { Building2 } from "lucide-react";
import { CompaniesList } from "@/components/companies/companies-list";

export default async function CompaniesPage() {
    const result = await getAllCompanies();
    const companies = result.success ? result.companies : [];

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
                        <p className="text-muted-foreground">
                            Manage your company database
                        </p>
                    </div>
                    <AddCompanyDialog />
                </div>

                {/* Companies List with Search */}
                {companies.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No companies yet</p>
                            <p className="text-sm text-muted-foreground">
                                Get started by adding your first company
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <CompaniesList initialCompanies={companies} />
                )}
            </div>
        </AppShell>
    );
}
