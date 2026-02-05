"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";

interface LinkPreviewData {
    title: string;
    description: string;
    image: string | null;
    favicon: string;
    siteName: string;
    url: string;
}

interface LinkPreviewCardProps {
    url: string;
    className?: string;
}

export function LinkPreviewCard({ url, className = "" }: LinkPreviewCardProps) {
    const [preview, setPreview] = useState<LinkPreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        async function fetchPreview() {
            try {
                const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error('Failed to fetch preview');

                const data = await response.json();
                setPreview(data);
            } catch (err) {
                console.error('Error fetching link preview:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchPreview();
    }, [url]);

    if (loading) {
        return (
            <div className={`border rounded-lg p-4 bg-muted/30 flex items-center justify-center h-24 ${className}`}>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !preview) {
        // Fallback: Simple link display
        const domain = new URL(url).hostname;
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`border rounded-lg p-3 hover:bg-muted/50 transition-colors flex items-center gap-3 group ${className}`}
            >
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-primary">{domain}</p>
                    <p className="text-xs text-muted-foreground truncate">{url}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </a>
        );
    }

    return (
        <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`border rounded-lg overflow-hidden hover:shadow-md transition-all group ${className}`}
        >
            {/* Thumbnail Image */}
            {preview.image && !imageError ? (
                <div className="relative w-full h-32 bg-muted overflow-hidden">
                    <img
                        src={preview.image}
                        alt={preview.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageError(true)}
                    />
                </div>
            ) : (
                <div className="w-full h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                </div>
            )}

            {/* Content */}
            <div className="p-3">
                <div className="flex items-start gap-2 mb-2">
                    {/* Favicon */}
                    <img
                        src={preview.favicon}
                        alt=""
                        className="h-4 w-4 mt-0.5 flex-shrink-0"
                        onError={(e) => {
                            // Hide favicon if it fails to load
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {preview.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">{preview.siteName}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                </div>

                {preview.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {preview.description}
                    </p>
                )}
            </div>
        </a>
    );
}
