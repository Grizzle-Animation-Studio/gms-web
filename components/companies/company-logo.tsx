"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchAndStoreCompanyLogo } from "@/app/actions/company-logo";
import { getFaviconUrl } from "@/lib/favicon";
import { RefreshCw, Download } from "lucide-react";
import Image from "next/image";

interface CompanyLogoProps {
    companyId: string;
    companyName: string;
    website: string | null;
    logoUrl: string | null;
}

export function CompanyLogo({ companyId, companyName, website, logoUrl }: CompanyLogoProps) {
    const [currentLogoUrl, setCurrentLogoUrl] = useState(logoUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If we have a website but no logo, show the potential favicon immediately
    const displayUrl = currentLogoUrl || (website ? getFaviconUrl(website) : null);

    async function handleFetchLogo() {
        if (!website) return;

        setIsLoading(true);
        setError(null);

        const result = await fetchAndStoreCompanyLogo(companyId);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else if (result.logoUrl) {
            setCurrentLogoUrl(result.logoUrl);
        }
    }

    if (!website && !currentLogoUrl) {
        // No website and no logo - show placeholder initials
        const initials = companyName
            .split(' ')
            .map(word => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        return (
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {initials}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            {/* Logo Display */}
            <div className="w-16 h-16 rounded-lg bg-muted border overflow-hidden flex items-center justify-center">
                {displayUrl ? (
                    // Using img tag instead of Next.js Image for external favicons
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={displayUrl}
                        alt={`${companyName} logo`}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                            // Fallback to initials on error
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                        {companyName.slice(0, 2).toUpperCase()}
                    </span>
                )}
            </div>

            {/* Fetch Button - only show if we have a website and no stored logo */}
            {website && !currentLogoUrl && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFetchLogo}
                    disabled={isLoading}
                    title="Save logo to company"
                >
                    {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                </Button>
            )}

            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
        </div>
    );
}
