"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, File, Trash2, Download } from "lucide-react";
import { deleteEnquiryAttachment } from "@/app/actions/enquiry-attachments";
import { toast } from "sonner";

type Attachment = {
    id: string;
    filename: string;
    fileSize: number;
    mimeType: string | null;
    uploadedAt: Date;
};

export function AttachmentsSection({
    enquiryId,
    attachments
}: {
    enquiryId: string;
    attachments: Attachment[]
}) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const getFileIcon = (mimeType: string | null) => {
        if (!mimeType) return <File className="h-4 w-4" />;
        if (mimeType.startsWith("image/")) return <Image className="h-4 w-4" />;
        if (mimeType.includes("pdf")) return <FileText className="h-4 w-4" />;
        return <File className="h-4 w-4" />;
    };

    const handleDelete = async (attachmentId: string, filename: string) => {
        if (!confirm(`Delete ${filename}?`)) return;

        const result = await deleteEnquiryAttachment(attachmentId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Attachment deleted");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Attachments</CardTitle>
                        <CardDescription>
                            {attachments.length} file{attachments.length !== 1 ? "s" : ""}
                        </CardDescription>
                    </div>
                    <Button onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No attachments yet. Click Upload to add files.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
                            >
                                <div className="text-muted-foreground">
                                    {getFileIcon(attachment.mimeType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <a
                                        href={`/api/enquiries/attachments/${attachment.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium truncate text-blue-600 hover:underline cursor-pointer block"
                                    >
                                        {attachment.filename}
                                    </a>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(attachment.fileSize)} • {" "}
                                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/api/enquiries/attachments/${attachment.id}?download=true`}
                                        download={attachment.filename}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                                        title="Download file"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(attachment.id, attachment.filename)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* TODO: Upload Dialog */}
            {uploadDialogOpen && (
                <div>Upload dialog placeholder - Coming soon</div>
            )}
        </Card>
    );
}
