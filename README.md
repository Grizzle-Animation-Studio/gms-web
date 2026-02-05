# GMS - Grizzle Master System

Production management system for Grizzle's animation and video production workflow.

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your local values

# Initialize database
npx prisma migrate dev

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions to Vercel + Supabase.

**Quick deployment checklist:**
1. Create Supabase project → Get connection strings
2. Run database migration locally (see DEPLOYMENT.md)
3. Deploy to Vercel → Configure environment variables
4. Update Dropbox OAuth redirect URLs
5. Test deployed application

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Supabase/Neon)
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **Storage**: Dropbox API
- **AI**: OpenAI (enquiry parsing)

## Features

- 📧 **Enquiry Management**: AI-powered email parsing and information extraction
- 🎬 **Project Management**: Complete production pipeline tracking
- ✅ **Checklist System**: Customizable production gating with required steps
- 📦 **Deliverables Tracking**: Multi-deliverable support with detailed specs
- 🏢 **Company & Contact Management**: Client-side and freelancer contacts
- ☁️ **Dropbox Integration**: Automated project folder creation
- 🎨 **Brand Management**: Company logo and color customization

## Project Structure

```
gms-web/
├── app/                  # Next.js app router
│   ├── actions/         # Server actions
│   ├── api/            # API routes
│   └── (pages)/        # Page routes
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── companies/      # Company-specific components
│   ├── contacts/       # Contact management
│   ├── enquiries/      # Enquiry handling
│   └── projects/       # Project management
├── lib/                # Utilities
│   ├── db.ts           # Prisma client
│   ├── llm.ts          # AI/OpenAI integration
│   └── dropbox.ts      # Dropbox API
├── prisma/             # Database schema and migrations
└── public/             # Static assets
```

## Development

```bash
# Run dev server
npm run dev

# Database management
npx prisma studio          # Visual database browser
npx prisma migrate dev     # Create migration
npx prisma generate        # Regenerate Prisma client

# Build for production
npm run build
```

## Environment Variables

See [`.env.example`](./.env.example) for required environment variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth secret key
- `NEXTAUTH_URL` - Application URL
- `DROPBOX_CLIENT_ID` - Dropbox app ID
- `DROPBOX_CLIENT_SECRET` - Dropbox app secret

**Optional:**
- `OPENAI_API_KEY` - For AI enquiry parsing

## Contributing

This is an internal project. For questions or issues, contact the development team.

## License

Proprietary - Grizzle Media
