# GMS Deployment Checklist

## Prerequisites (Do These First)

### 1. Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com) and create account/sign in
- [ ] Click "New Project"
- [ ] Name: `gms-staging` (or your preference)
- [ ] Database Password: Generate strong password (save it!)
- [ ] Region: Choose closest to you (e.g., `us-east-1` or `eu-west-1`)
- [ ] Wait ~2 minutes for provisioning

### 2. Get Database Connection Strings
- [ ] In Supabase: Settings → Database
- [ ] Copy **Connection pooling** string (for Vercel)
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- [ ] Copy **Direct connection** string (for migrations)
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```

### 3. Initialize Database Schema
Run this locally to push the schema to your new PostgreSQL database:

```bash
# Set the direct connection URL temporarily
$env:DATABASE_URL="your-direct-connection-string-here"

# Delete old SQLite migrations
Remove-Item -Recurse -Force .\prisma\migrations

# Create fresh migration for PostgreSQL
npx prisma migrate dev --name init_postgresql

# Verify it worked
npx prisma studio
```

### 4. Prepare Vercel Deployment
- [ ] Push code to GitHub (if not already)
- [ ] Go to [vercel.com](https://vercel.com) and sign in
- [ ] Click "Add New Project"
- [ ] Import your GitHub repository

### 5. Configure Environment Variables in Vercel
In Vercel project settings → Environment Variables, add:

```bash
# Database (use POOLED connection string)
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

# NextAuth
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]
NEXTAUTH_URL=https://your-project.vercel.app

# Dropbox
DROPBOX_CLIENT_ID=[from Dropbox app console]
DROPBOX_CLIENT_SECRET=[from Dropbox app console]  
DROPBOX_REDIRECT_URI=https://your-project.vercel.app/api/auth/dropbox/callback

# Optional: OpenAI
OPENAI_API_KEY=sk-...
```

### 6. Update Dropbox OAuth Settings
- [ ] Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
- [ ] Select your app
- [ ] Add to "Redirect URIs": `https://your-project.vercel.app/api/auth/dropbox/callback`
- [ ] Save

### 7. Deploy!
- [ ] In Vercel, click "Deploy"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Visit your deployed site

### 8. Post-Deployment Verification
- [ ] App loads without errors
- [ ] Can sign in
- [ ] Database connection works (check Vercel logs if issues)
- [ ] Test creating an enquiry
- [ ] Test converting to project
- [ ] Test deliverables flow
- [ ] Test Dropbox integration

---

## Troubleshooting

### Build Fails
- Check Vercel build logs for specific error
- Verify all environment variables are set
- Ensure `prisma generate` runs successfully

### Database Connection Issues
- Double-check you're using the **pooled** connection string
- Verify password is correct
- Check Supabase connection limits (increase if needed)

### Dropbox OAuth Fails
- Verify redirect URI matches exactly (including https)
- Check client ID and secret are correct
- Ensure app is not in development mode restrictions

---

## Next Steps After Deployment

Once deployed successfully:
1. ✅ Continue building features in production environment
2. ✅ Use Vercel preview deployments for testing new features
3. ✅ Monitor Vercel function logs and Supabase analytics
4. ✅ Build client approval portal next!
