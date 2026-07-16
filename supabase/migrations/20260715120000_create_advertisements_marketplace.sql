CREATE TABLE IF NOT EXISTS public.advertisements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL CHECK (char_length(description) <= 300),
  category text NOT NULL DEFAULT 'other' CHECK (
    category IN ('general', 'products', 'services', 'solar', 'real_estate', 'food', 'fashion', 'other')
  ),
  image_url text,
  link_url text,
  contact_email text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  expires_at date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.advertisements
DROP CONSTRAINT IF EXISTS advertisements_category_check;

ALTER TABLE public.advertisements
ADD CONSTRAINT advertisements_category_check
CHECK (category IN ('general', 'products', 'services', 'solar', 'real_estate', 'food', 'fashion', 'other'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'advertisements'
      AND policyname = 'Public can view active advertisements'
  ) THEN
    CREATE POLICY "Public can view active advertisements"
      ON public.advertisements FOR SELECT
      USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'advertisements'
      AND policyname = 'Admins can manage advertisements'
  ) THEN
    CREATE POLICY "Admins can manage advertisements"
      ON public.advertisements FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND is_admin = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('advertisement-images', 'advertisement-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can view advertisement images'
  ) THEN
    CREATE POLICY "Public can view advertisement images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'advertisement-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload advertisement images'
  ) THEN
    CREATE POLICY "Admins can upload advertisement images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'advertisement-images'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;
