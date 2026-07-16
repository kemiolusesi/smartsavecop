/*
  # Enhance Profiles Table for Multi-Step Onboarding

  1. Modified Tables
    - `profiles`
      - Add `preferred_currency` (text, default 'NGN')
      - Add `financial_focus` (text, for archetype classification)
      - Add `monthly_target` (numeric, for savings commitment in smallest currency unit)
      - Add `onboarding_step` (int, tracks progress if needed)

  2. Purpose
    - Captures user identity parameters (name, phone, currency)
    - Stores financial focus archetype (personal, business, emergency, etc.)
    - Tracks monthly savings target for goal monitoring
    - Enables multi-step onboarding progression
*/

DO $$
BEGIN
  -- Add preferred_currency if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_currency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_currency text DEFAULT 'NGN';
  END IF;

  -- Add financial_focus if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'financial_focus'
  ) THEN
    ALTER TABLE profiles ADD COLUMN financial_focus text;
  END IF;

  -- Add monthly_target if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_target'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_target numeric(15,2) DEFAULT 0;
  END IF;

  -- Add onboarding_step if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_step integer DEFAULT 1;
  END IF;
END $$;
