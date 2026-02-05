# Database Connection String Needed

We're stuck on getting the correct Supabase connection string format.

## What to Look For in Supabase:

Try these locations:
1. **Home/Dashboard** → "Connect" button
2. **Database** section (left sidebar)
3. **Project Settings → Database**

You need the **"Direct connection"** or **"URI"** string that looks like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

## Alternative: Skip This Step

We can also skip the local migration and let it run automatically on Vercel during the first deployment. This is simpler!

To do that:
1. Set up the Supabase → Vercel integration (in Supabase Integrations tab)
2. Deploy to Vercel
3. The migration will run automatically during build

Which approach would you prefer?
