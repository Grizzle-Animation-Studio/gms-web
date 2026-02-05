import { AppShell } from "@/components/layout/Shell";
import { getEnquiries } from "@/app/actions/enquiry";
import { NewEnquiryDialog } from "@/components/enquiries/new-enquiry-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { EnquiriesList } from "@/components/enquiries/enquiries-list";

export default async function EnquiriesPage() {
    const enquiries = await getEnquiries();

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Enquiries</h2>
                        <p className="text-muted-foreground">Manage incoming requests and convert them to projects.</p>
                    </div>
                    <NewEnquiryDialog />
                </div>

                {enquiries.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No enquiries yet</p>
                            <p className="text-sm text-muted-foreground">
                                Start by adding your first enquiry
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <EnquiriesList initialEnquiries={enquiries} />
                )}
            </div>
        </AppShell>
    );
}
