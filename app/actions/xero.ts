"use server";

import { xeroClient } from "@/lib/xero";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Get Xero connection status
 */
export async function getXeroStatus() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('xero_access_token');
        const tenantId = cookieStore.get('xero_tenant_id');

        return {
            connected: !!accessToken, // Only need access token to be connected
            tenantId: tenantId?.value,
        };
    } catch (error: any) {
        return { connected: false, error: error.message };
    }
}

/**
 * Sync contacts from Xero to GMS
 */
export async function syncContactsFromXero() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('xero_access_token');
        const refreshToken = cookieStore.get('xero_refresh_token');
        let tenantId = cookieStore.get('xero_tenant_id');

        if (!accessToken) {
            return { error: "Not connected to Xero. Please connect first." };
        }

        // Set up Xero client with tokens
        await xeroClient.setTokenSet({
            access_token: accessToken.value,
            refresh_token: refreshToken?.value,
            token_type: 'Bearer',
        });

        // Refresh token if needed (xero-node handles this automatically)
        try {
            const tokenSet = await xeroClient.readTokenSet();

            // Update cookies with refreshed tokens
            if (tokenSet.access_token && tokenSet.access_token !== accessToken.value) {
                console.log('[Xero Sync] Access token was refreshed');
                cookieStore.set('xero_access_token', tokenSet.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: tokenSet.expires_in || 1800,
                    path: '/',
                });

                if (tokenSet.refresh_token) {
                    cookieStore.set('xero_refresh_token', tokenSet.refresh_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 60 * 60 * 24 * 60,
                        path: '/',
                    });
                }
            }
        } catch (refreshError: any) {
            console.error('[Xero Sync] Token refresh failed:', refreshError.message);
            return { error: "Authentication expired. Please reconnect to Xero." };
        }


        // Get tenant ID if we don't have it
        if (!tenantId) {
            // Try environment variable first (since updateTenants requires org permissions we don't have)
            const envTenantId = process.env.XERO_TENANT_ID;

            if (envTenantId) {
                console.log('[Xero Sync] Using tenant ID from environment');
                tenantId = { value: envTenantId } as any;

                // Store it in cookie for next time
                cookieStore.set('xero_tenant_id', envTenantId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 60,
                    path: '/',
                });
            } else {
                return { error: "No Xero tenant ID found. Please add XERO_TENANT_ID to your .env file." };
            }
        }

        // TypeScript guard - tenantId is guaranteed to be set here  
        if (!tenantId) {
            return { error: "Unable to determine Xero tenant ID" };
        }

        // Fetch contacts from Xero - only customers (not suppliers)
        const response = await xeroClient.accountingApi.getContacts(
            tenantId.value,
            undefined, // modifiedAfter
            undefined, // where
            undefined, // order
            undefined, // IDs
            undefined, // page
            undefined, // includeArchived
            undefined, // summaryOnly
            undefined  // searchTerm
        );

        // Filter to only include customers (people we invoice TO, not suppliers we pay)
        const allContacts = response.body.contacts || [];
        const xeroContacts = allContacts.filter(contact => contact.isCustomer === true);

        console.log(`[Xero Sync] Found ${allContacts.length} total contacts, ${xeroContacts.length} are customers`);


        let created = 0;
        let updated = 0;
        let matched = 0;

        for (const xeroContact of xeroContacts) {
            if (!xeroContact.name) continue;

            // Try to find existing company by Xero ID
            let company = await prisma.company.findFirst({
                where: { xeroContactId: xeroContact.contactID },
            });

            if (company) {
                // Update existing company
                await prisma.company.update({
                    where: { id: company.id },
                    data: {
                        name: xeroContact.name,
                        companyEmail: xeroContact.emailAddress || company.companyEmail,
                        companyPhone: xeroContact.phones?.[0]?.phoneNumber || company.companyPhone,
                        street: xeroContact.addresses?.[0]?.addressLine1 || company.street,
                        city: xeroContact.addresses?.[0]?.city || company.city,
                        state: xeroContact.addresses?.[0]?.region || company.state,
                        postcode: xeroContact.addresses?.[0]?.postalCode || company.postcode,
                        abn: xeroContact.taxNumber || company.abn,
                        xeroSyncedAt: new Date(),
                    },
                });
                updated++;
            } else {
                // Try to match by name (fuzzy) - SQLite doesn't support case-insensitive contains
                const potentialMatch = await prisma.company.findFirst({
                    where: {
                        name: {
                            contains: xeroContact.name,
                        },
                    },
                });

                if (potentialMatch && !potentialMatch.xeroContactId) {
                    // Link existing company to Xero
                    await prisma.company.update({
                        where: { id: potentialMatch.id },
                        data: {
                            xeroContactId: xeroContact.contactID,
                            companyEmail: xeroContact.emailAddress || potentialMatch.companyEmail,
                            companyPhone: xeroContact.phones?.[0]?.phoneNumber || potentialMatch.companyPhone,
                            xeroSyncedAt: new Date(),
                        },
                    });
                    matched++;
                } else {
                    // Create new company
                    await prisma.company.create({
                        data: {
                            name: xeroContact.name,
                            companyEmail: xeroContact.emailAddress,
                            companyPhone: xeroContact.phones?.[0]?.phoneNumber,
                            street: xeroContact.addresses?.[0]?.addressLine1,
                            city: xeroContact.addresses?.[0]?.city,
                            state: xeroContact.addresses?.[0]?.region,
                            postcode: xeroContact.addresses?.[0]?.postalCode,
                            abn: xeroContact.taxNumber,
                            xeroContactId: xeroContact.contactID,
                            xeroSyncedAt: new Date(),
                        },
                    });
                    created++;
                }
            }
        }

        revalidatePath('/companies');
        revalidatePath('/settings');

        return {
            success: true,
            created,
            updated,
            matched,
            total: xeroContacts.length,
        };
    } catch (error: any) {
        console.error('Xero sync error:', error);
        return { error: error.message || "Failed to sync contacts from Xero" };
    }
}

/**
 * Disconnect Xero
 */
export async function disconnectXero() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('xero_access_token');
        cookieStore.delete('xero_refresh_token');
        cookieStore.delete('xero_tenant_id');

        revalidatePath('/settings');

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Clear all Xero-synced companies (for development/testing)
 */
export async function clearSyncedClients() {
    try {
        // First, get all company IDs that are synced from Xero
        const syncedCompanies = await prisma.company.findMany({
            where: {
                xeroContactId: {
                    not: null,
                },
            },
            select: { id: true },
        });

        const companyIds = syncedCompanies.map(c => c.id);

        if (companyIds.length === 0) {
            return { success: true, deleted: 0 };
        }

        // Delete related records first to avoid foreign key constraints
        await prisma.contactClientSide.deleteMany({
            where: { companyId: { in: companyIds } },
        });

        await prisma.enquiry.deleteMany({
            where: { companyId: { in: companyIds } },
        });

        await prisma.project.deleteMany({
            where: { companyId: { in: companyIds } },
        });

        // Now delete the companies
        const result = await prisma.company.deleteMany({
            where: {
                xeroContactId: {
                    not: null,
                },
            },
        });

        revalidatePath('/companies');
        revalidatePath('/contacts');
        revalidatePath('/settings');

        return { success: true, deleted: result.count };
    } catch (error: any) {
        console.error('Clear synced clients error:', error);
        return { error: error.message };
    }
}
