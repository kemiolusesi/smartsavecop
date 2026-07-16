ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_onboarded boolean DEFAULT false;

UPDATE profiles
SET is_onboarded = COALESCE(is_onboarded, onboarding_completed, false);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique
  ON profiles(user_id);
