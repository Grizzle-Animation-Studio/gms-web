import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get attachment metadata from database
        const attachment = await prisma.enquiryAttachment.findUnique({
            where: { id },
        });

        if (!attachment) {
            return NextResponse.json(
                { error: 'Attachment not found' },
                { status: 404 }
            );
        }

        // Read file from local storage
        const uploadsDir = path.join(process.cwd(), 'uploads', 'enquiries');
        const filePath = path.join(uploadsDir, attachment.id);

        try {
            const fileBuffer = await fs.readFile(filePath);

            // Check if download is requested via query param
            const searchParams = request.nextUrl.searchParams;
            const forceDownload = searchParams.get('download') === 'true';

            // Return file with appropriate headers
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': attachment.mimeType || 'application/octet-stream',
                    'Content-Disposition': forceDownload
                        ? `attachment; filename="${attachment.filename}"`
                        : `inline; filename="${attachment.filename}"`,
                    'Content-Length': attachment.fileSize.toString(),
                },
            });
        } catch (fileError) {
            console.error('File not found on disk:', fileError);
            return NextResponse.json(
                { error: 'File not found on server' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Failed to download attachment:', error);
        return NextResponse.json(
            { error: 'Failed to download file' },
            { status: 500 }
        );
    }
}
