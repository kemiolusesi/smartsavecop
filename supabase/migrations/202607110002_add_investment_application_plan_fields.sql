ALTER TABLE public.investment_applications
  ADD COLUMN IF NOT EXISTS monthly_contribution NUMERIC,
  ADD COLUMN IF NOT EXISTS preferred_plan TEXT,
  ADD COLUMN IF NOT EXISTS target_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS preferred_duration_months INTEGER,
  ADD COLUMN IF NOT EXISTS lump_sum_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS preferred_tenure_months INTEGER,
  ADD COLUMN IF NOT EXISTS number_of_shares INTEGER,
  ADD COLUMN IF NOT EXISTS agreed_return_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS maturity_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_return_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
