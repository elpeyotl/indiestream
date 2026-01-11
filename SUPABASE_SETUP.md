# Supabase Setup Guide

This guide walks you through setting up Supabase for the Indiestream platform.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in details:
   - **Name**: indiestream
   - **Database Password**: (generate strong password and save it)
   - **Region**: Choose closest to your users
4. Click "Create new project"

Wait for the project to finish setting up (~2 minutes).

## 2. Get API Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy these values to your `.env` file:

\`\`\`env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
\`\`\`

## 3. Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI**

\`\`\`bash
npm install -g supabase
\`\`\`

2. **Login to Supabase**

\`\`\`bash
supabase login
\`\`\`

3. **Link your project**

\`\`\`bash
supabase link --project-ref your-project-ref
\`\`\`

(Find your project ref in the URL: https://supabase.com/dashboard/project/**your-project-ref**)

4. **Run migrations**

\`\`\`bash
supabase db push
\`\`\`

### Option B: Using SQL Editor (Manual)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "+ New query"
3. Copy the contents of `supabase/migrations/20260111_initial_schema.sql`
4. Paste and click "Run"

## 4. Configure Authentication

### Enable Email Auth

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates:
   - Go to **Authentication** > **Email Templates**
   - Customize **Confirm signup** template
   - Customize **Reset password** template

### Optional: Enable Social Auth

For Google, Twitter, etc.:

1. Go to **Authentication** > **Providers**
2. Enable desired provider (e.g., Google)
3. Add OAuth credentials from provider
4. Configure redirect URLs

## 5. Configure Storage (for images)

### Create Storage Buckets

1. Go to **Storage** section
2. Create buckets:

\`\`\`
- album-covers (public)
- band-avatars (public)
- band-banners (public)
\`\`\`

### Set Bucket Policies

For each bucket, configure policies:

**Public Read Policy:**
\`\`\`sql
CREATE POLICY "Public can read album covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'album-covers');
\`\`\`

**Authenticated Upload Policy:**
\`\`\`sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'album-covers' AND
  auth.role() = 'authenticated'
);
\`\`\`

## 6. Set Up Row Level Security (RLS)

RLS policies are included in the migration file and will be automatically created.

To verify they're active:

1. Go to **Database** > **Tables**
2. Click on any table (e.g., `profiles`)
3. Go to **Policies** tab
4. Verify policies exist

## 7. Create Admin User

After signing up your first user:

1. Go to **SQL Editor**
2. Run this query to make yourself admin:

\`\`\`sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
\`\`\`

## 8. Edge Functions (for later)

Edge Functions will be deployed when needed for:
- Audio URL signing
- Revenue calculation
- Stripe webhooks

To deploy an Edge Function:

\`\`\`bash
supabase functions deploy function-name
\`\`\`

## 9. Database Types Generation

Generate TypeScript types from your database schema:

\`\`\`bash
npx supabase gen types typescript --project-id your-project-ref > types/database.types.ts
\`\`\`

This creates type-safe database queries in your Nuxt app.

## 10. Environment Variables Summary

After setup, your `.env` should have:

\`\`\`env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# These will be added later as you set up other services
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ACCOUNT_ID=
\`\`\`

## Testing the Setup

1. Start your dev server:

\`\`\`bash
npm run dev
\`\`\`

2. Try to register a new user at `/register`
3. Check if the user appears in **Authentication** > **Users** in Supabase dashboard
4. Check if a profile was created in `public.profiles` table

## Troubleshooting

### "relation does not exist" errors

- Make sure migrations ran successfully
- Check **Database** > **Tables** to verify tables exist

### Can't insert into tables

- Verify RLS policies are set up
- Check if user is authenticated
- Use service role key for admin operations

### Email confirmation not working

- Check email templates are configured
- For development, check **Authentication** > **Users** and manually confirm email
- Or disable email confirmation in **Authentication** > **Settings**

## Next Steps

Once Supabase is set up:

1. ✅ Users can register and log in
2. ✅ Database schema is ready
3. ⏭️ Set up Stripe for subscriptions
4. ⏭️ Set up Cloudflare R2 for audio storage
5. ⏭️ Build out the band registration flow

---

For questions or issues, refer to [Supabase Documentation](https://supabase.com/docs).
