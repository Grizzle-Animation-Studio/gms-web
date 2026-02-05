"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchCompanies } from "@/app/actions/company";
import { Label } from "@/components/ui/label";

type Client = {
    id: string;
    name: string;
    companyEmail: string | null;
};

export function ClientSelector({
    value,
    onValueChange,
    label = "Client (Optional)",
}: {
    value?: string;
    onValueChange: (value: string | undefined) => void;
    label?: string;
}) {
    const [clients, setClients] = React.useState<Client[]>([]);
    const [selectedCompany, setSelectedCompany] = React.useState<Client | null>(null);
    const [search, setSearch] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [showResults, setShowResults] = React.useState(false);

    // Fetch the selected company when value prop changes
    React.useEffect(() => {
        async function loadSelectedCompany() {
            if (!value) {
                setSelectedCompany(null);
                return;
            }

            // Check if we already have this company in the clients array
            const existingClient = clients.find((c) => c.id === value);
            if (existingClient) {
                setSelectedCompany(existingClient);
                return;
            }

            // Fetch the company by ID
            try {
                console.log('🔍 Fetching company by ID:', value);
                const { getCompanyById } = await import("@/app/actions/company");
                const result = await getCompanyById(value);
                if (result.success && result.company) {
                    console.log('✅ Loaded company:', result.company.name);
                    setSelectedCompany({
                        id: result.company.id,
                        name: result.company.name,
                        companyEmail: result.company.companyEmail,
                    });
                } else {
                    console.warn('⚠️ Company not found for ID:', value);
                }
            } catch (error) {
                console.error('Failed to load selected company:', error);
            }
        }

        loadSelectedCompany();
    }, [value]);

    // Search clients when search term changes
    React.useEffect(() => {
        async function loadClients() {
            if (!search || search.length < 2) {
                setClients([]);
                setShowResults(false);
                return;
            }

            setLoading(true);
            setShowResults(true);
            const result = await searchCompanies(search);
            setLoading(false);

            if (result.success && result.companies) {
                setClients(result.companies as Client[]);
            }
        }

        const debounce = setTimeout(loadClients, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    // Use the selectedCompany state that's populated by the useEffect above
    const selectedClient = selectedCompany;

    function handleSelect(client: Client) {
        onValueChange(client.id);
        setSearch("");
        setShowResults(false);
    }

    function handleClear() {
        onValueChange(undefined);
        setSearch("");
        setShowResults(false);
    }

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>

            {selectedClient ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <Check className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                        <p className="font-medium">{selectedClient.name}</p>
                        {selectedClient.companyEmail && (
                            <p className="text-sm text-muted-foreground">{selectedClient.companyEmail}</p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search for a client..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => search.length >= 2 && setShowResults(true)}
                            className="pl-10"
                        />
                    </div>

                    {showResults && (
                        <div className="absolute z-50 w-full mt-1 bg-popover rounded-md border shadow-md max-h-60 overflow-auto">
                            {loading && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Searching...
                                </div>
                            )}
                            {!loading && clients.length === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No clients found. Try a different search.
                                </div>
                            )}
                            {!loading && clients.length > 0 && (
                                <div className="p-1">
                                    {clients.map((client) => (
                                        <button
                                            key={client.id}
                                            type="button"
                                            onClick={() => handleSelect(client)}
                                            className="w-full text-left p-2 rounded-sm hover:bg-accent transition-colors"
                                        >
                                            <p className="font-medium">{client.name}</p>
                                            {client.companyEmail && (
                                                <p className="text-sm text-muted-foreground">{client.companyEmail}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
