import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });

        return NextResponse.json(companies);
    } catch (error) {
        console.error("Error fetching companies:", error);
        return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }
}
