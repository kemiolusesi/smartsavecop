/*
  # Add Onboarding Fields to Profiles

  1. Modified Tables
    - `profiles`
      - Add `onboarding_completed` (boolean, default false)
      - Add `account_type` (text, for account classification)
      - Add `phone` (text, optional)

  2. Purpose
    - Tracks whether user has completed post-signup onboarding
    - Stores account classification for personalized experience
    - Stores contact information for support
*/

DO $$
BEGIN
  -- Add onboarding_completed if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  -- Add account_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_type text DEFAULT 'personal';
  END IF;

  -- Add phone if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;
