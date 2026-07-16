/*
  # Hybrid Authentication Schema Extension

  1. Add Missing Fields to profiles table
    - email (text, unique) - for quick lookups without auth.users joins
    - has_paid (boolean, default false) - tracks payment/subscription status
    - onboarding_data (jsonb) - flexible storage for onboarding metadata

  2. Purpose
    - Supports hybrid auth: token for first-time users, password for paid users
    - Enables quick profile checks without auth system overhead
    - Stores onboarding metadata in structured JSON format
*/

DO $$
BEGIN
  -- Add email field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text UNIQUE;
  END IF;

  -- Add has_paid field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'has_paid'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_paid boolean DEFAULT false;
  END IF;

  -- Add onboarding_data field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_data'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
