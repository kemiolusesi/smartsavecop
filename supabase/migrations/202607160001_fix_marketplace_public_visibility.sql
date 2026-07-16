ALTER TABLE public.advertisements
DROP CONSTRAINT IF EXISTS advertisements_category_check;

ALTER TABLE public.advertisements
ADD CONSTRAINT advertisements_category_check
CHECK (category IN ('general', 'products', 'services', 'solar', 'real_estate', 'food', 'fashion', 'other'));

DROP POLICY IF EXISTS "Public can view active advertisements" ON public.advertisements;

CREATE POLICY "Public can view active advertisements"
  ON public.advertisements FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
  );
