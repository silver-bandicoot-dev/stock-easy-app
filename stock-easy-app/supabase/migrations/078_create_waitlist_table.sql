-- Migration: Create waitlist table for Coming Soon page
-- This table stores email addresses of users who want early access

-- Create the waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'coming_soon',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    subscribed BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add comment
COMMENT ON TABLE public.waitlist IS 'Stores email addresses for pre-launch waitlist';

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to INSERT (signup)
CREATE POLICY "Anyone can signup to waitlist"
    ON public.waitlist
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy: Only authenticated admins can SELECT (view list)
-- For now, we'll allow service role to read all
CREATE POLICY "Service role can read waitlist"
    ON public.waitlist
    FOR SELECT
    TO service_role
    USING (true);

-- Grant permissions
GRANT INSERT ON public.waitlist TO anon;
GRANT INSERT ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;

