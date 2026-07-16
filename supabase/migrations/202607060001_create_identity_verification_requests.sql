-- Identity verification requests replace BVN-specific member verification.

ALTER TABLE profiles DROP COLUMN IF EXISTS bvn;
ALTER TABLE profiles DROP COLUMN IF EXISTS bvn_verified;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_verification_status TEXT DEFAULT 'pending'
  CHECK (identity_verification_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS identity_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('id_card', 'nin')),
  nin_number TEXT,
  id_card_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  rejection_reason TEXT,
  CHECK (
    (verification_type = 'nin' AND nin_number IS NOT NULL AND id_card_image_url IS NULL)
    OR
    (verification_type = 'id_card' AND id_card_image_url IS NOT NULL AND nin_number IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_identity_verification_requests_user_id
  ON identity_verification_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_identity_verification_requests_status
  ON identity_verification_requests(status, submitted_at DESC);

ALTER TABLE identity_verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own identity requests" ON identity_verification_requests;
CREATE POLICY "Members can read own identity requests"
  ON identity_verification_requests FOR SELECT
  USING (auth.uid() = user_id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Members can create own identity requests" ON identity_verification_requests;
CREATE POLICY "Members can create own identity requests"
  ON identity_verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage identity requests" ON identity_verification_requests;
CREATE POLICY "Admins can manage identity requests"
  ON identity_verification_requests FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', false)
ON CONFLICT (id) DO NOTHING;
