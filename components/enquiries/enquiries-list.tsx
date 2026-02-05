"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";
import { formatDistanceToNow } from "date-fns";
import { getFaviconUrl } from "@/lib/favicon";

type Enquiry = {
    id: string;
    title: string | null;
    description: string;
    receivedAt: Date;
    company: {
        id: string;
        name: string;
        website?: string | null;
    } | null;
    contact: {
        id: string;
        firstName: string;
        lastName: string | null;
    } | null;
    project: {
        id: string;
    } | null;
};

export function EnquiriesList({ initialEnquiries }: { initialEnquiries: Enquiry[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEnquiries = initialEnquiries.filter(enquiry =>
        enquiry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enquiry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enquiry.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enquiry.contact?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enquiry.contact?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search enquiries by title, description, company, or contact..."
            />

            {filteredEnquiries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No enquiries found matching your search" : "No enquiries yet"}
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                    {/* Header */}
                    <div className="hidden md:grid md:grid-cols-[auto_1fr_180px_140px_100px_32px] gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                        <div className="w-8"></div>
                        <div>Title / Company</div>
                        <div>Contact</div>
                        <div>Received</div>
                        <div>Status</div>
                        <div></div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y">
                        {filteredEnquiries.map((enquiry) => {
                            const companyWebsite = (enquiry.company as any)?.website;
                            const faviconUrl = companyWebsite ? getFaviconUrl(companyWebsite) : null;
                            const companyInitials = enquiry.company?.name
                                .split(' ')
                                .map(w => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase();

                            return (
                                <Link key={enquiry.id} href={`/enquiries/${enquiry.id}`}>
                                    <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_180px_140px_100px_32px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors items-center cursor-pointer group">
                                        {/* Favicon/Logo */}
                                        <div className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {faviconUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={faviconUrl}
                                                    alt=""
                                                    className="w-5 h-5 object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {companyInitials || '?'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title & Company */}
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">
                                                {enquiry.title || (enquiry.description ? enquiry.description.substring(0, 50) + "..." : "No title")}
                                            </p>
                                            {enquiry.company && (
                                                <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                                                    <Building2 className="h-3 w-3 flex-shrink-0" />
                                                    {enquiry.company.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Contact - hidden on mobile */}
                                        <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                                            {enquiry.contact ? (
                                                <>
                                                    <User className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {enquiry.contact.firstName} {enquiry.contact.lastName}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground/50">—</span>
                                            )}
                                        </div>

                                        {/* Received - hidden on mobile */}
                                        <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="truncate">
                                                {formatDistanceToNow(new Date(enquiry.receivedAt), { addSuffix: true })}
                                            </span>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center">
                                            {enquiry.project ? (
                                                <Badge variant="default" className="text-xs">Converted</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">Pending</Badge>
                                            )}
                                        </div>

                                        {/* Chevron */}
                                        <div className="hidden md:flex items-center justify-end">
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
