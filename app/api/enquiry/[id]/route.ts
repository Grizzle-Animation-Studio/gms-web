import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const enquiry = await prisma.enquiry.findUnique({
            where: { id },
            include: {
                deliverables: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!enquiry) {
            return NextResponse.json(
                { error: 'Enquiry not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(enquiry);
    } catch (error) {
        console.error('Error fetching enquiry:', error);
        return NextResponse.json(
            { error: 'Failed to fetch enquiry' },
            { status: 500 }
        );
    }
}
