import { NextRequest, NextResponse } from 'next/server';
import { xeroClient } from '@/lib/xero';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');

        console.log('[Xero Callback] Received callback:', {
            url: url.toString(),
            code: code ? 'present' : 'missing'
        });

        if (!code) {
            console.error('[Xero Callback] No code parameter');
            return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
        }

        // Exchange code for tokens
        console.log('[Xero Callback] Exchanging code for tokens...');
        const tokenSet = await xeroClient.apiCallback(url.toString());
        console.log('[Xero Callback] Token exchange successful');

        // Store tokens in cookies (in production, use a database)
        const cookieStore = await cookies();

        if (!tokenSet.access_token) {
            throw new Error('No access token received from Xero');
        }

        cookieStore.set('xero_access_token', tokenSet.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: tokenSet.expires_in || 1800, // 30 minutes
            path: '/',
        });

        if (tokenSet.refresh_token) {
            cookieStore.set('xero_refresh_token', tokenSet.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 60, // 60 days
                path: '/',
            });
        }

        // Try to get tenant ID - don't fail if this doesn't work
        console.log('[Xero Callback] Attempting to get tenant ID...');
        try {
            await xeroClient.setTokenSet(tokenSet);
            const tenants = await xeroClient.updateTenants(false); // false = don't autoRefresh

            if (tenants && tenants.length > 0) {
                console.log('[Xero Callback] Got tenant ID:', tenants[0].tenantId);
                cookieStore.set('xero_tenant_id', tenants[0].tenantId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 60,
                    path: '/',
                });
            }
        } catch (tenantError: any) {
            console.warn('[Xero Callback] Could not fetch tenant ID:', tenantError.message);
            // This is okay - we'll get it during first sync
        }


        // Redirect to settings with success
        console.log('[Xero Callback] Success! Redirecting...');
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(new URL('/settings?xero=connected', baseUrl));
    } catch (error: any) {
        console.error('[Xero Callback] Error:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
            error: error
        });

        const errorMsg = error?.message || error?.toString() || 'Unknown error occurred';
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(new URL('/settings?error=' + encodeURIComponent(errorMsg), baseUrl));
    }
}
