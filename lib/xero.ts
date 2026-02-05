import { XeroClient } from 'xero-node';

const xeroClient = new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: 'openid profile email accounting.contacts accounting.contacts.read offline_access'.split(' '),
});

export { xeroClient };
