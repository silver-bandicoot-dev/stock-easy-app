-- ============================================
-- Migration: Add onboarding status to user_profiles
-- Description: Track user onboarding tour completion
-- ============================================

-- Add onboarding_status column to user_profiles
-- Using JSONB to allow tracking multiple tours in the future
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_status JSONB DEFAULT '{"main_tour_completed": false, "completed_at": null}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.onboarding_status IS 'Tracks onboarding tour completion status. Structure: {main_tour_completed: boolean, completed_at: timestamp}';

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_status 
ON public.user_profiles USING GIN (onboarding_status);

