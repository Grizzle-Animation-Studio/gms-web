import { NextRequest, NextResponse } from 'next/server';
import { xeroClient } from '@/lib/xero';

export async function GET(request: NextRequest) {
    try {
        const consentUrl = await xeroClient.buildConsentUrl();
        return NextResponse.redirect(consentUrl);
    } catch (error: any) {
        console.error('Xero auth error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
