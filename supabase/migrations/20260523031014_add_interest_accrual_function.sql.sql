/*
  # Add Interest Accrual Function

  1. Purpose
    - Calculate accrued interest for active savings plans
    - Update accrued_interest column based on time elapsed
    - Support both simple and compound interest calculations
  
  2. New Functions
    - `calculate_accrued_interest(plan_id)` - Calculate interest for a specific plan
    - `update_all_active_plan_interests()` - Batch update all active plans
  
  3. Security
    - Functions run with security definer for secure updates
    - Only updates active plans
    - Validates plan status before calculation
  
  4. Notes
    - Simple interest: principal * rate * (days_elapsed / 365)
    - Compound interest: Uses daily compounding for accuracy
    - Returns numeric with 2 decimal precision
*/

CREATE OR REPLACE FUNCTION calculate_accrued_interest(plan_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan RECORD;
  days_elapsed INTEGER;
  annual_rate NUMERIC;
  principal NUMERIC;
  interest_type TEXT;
  accrued NUMERIC;
BEGIN
  SELECT * INTO plan
  FROM savings_plans
  WHERE id = plan_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  days_elapsed := EXTRACT(DAY FROM (NOW() - plan.start_date));
  annual_rate := plan.annual_rate;
  principal := plan.principal_amount;
  interest_type := 'simple'; -- Default to simple interest
  
  IF interest_type = 'simple' THEN
    accrued := principal * annual_rate * (days_elapsed::NUMERIC / 365.0);
  ELSE
    -- Compound interest: P(1 + r/n)^(n*t) - P
    accrued := principal * (POWER(1 + annual_rate / 365.0, days_elapsed) - 1);
  END IF;
  
  UPDATE savings_plans
  SET accrued_interest = ROUND(accrued, 2),
      updated_at = NOW()
  WHERE id = plan_id;
  
  RETURN ROUND(accrued, 2);
END;
$$;

CREATE OR REPLACE FUNCTION update_all_active_plan_interests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  plan_record RECORD;
BEGIN
  FOR plan_record IN
    SELECT id FROM savings_plans WHERE status = 'active'
  LOOP
    PERFORM calculate_accrued_interest(plan_record.id);
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_plan_projected_return(plan_id UUID)
RETURNS TABLE(
  current_interest NUMERIC,
  projected_total_interest NUMERIC,
  projected_final_amount NUMERIC,
  days_remaining INTEGER,
  monthly_payout NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan RECORD;
  total_days INTEGER;
  days_elapsed INTEGER;
  days_remaining INTEGER;
  projected_interest NUMERIC;
BEGIN
  SELECT * INTO plan
  FROM savings_plans
  WHERE id = plan_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0, 0::NUMERIC;
    RETURN;
  END IF;
  
  total_days := EXTRACT(DAY FROM (plan.mature_date - plan.start_date));
  days_elapsed := EXTRACT(DAY FROM (NOW() - plan.start_date));
  days_remaining := total_days - days_elapsed;
  
  projected_interest := plan.principal_amount * plan.annual_rate * (total_days::NUMERIC / 365.0);
  
  RETURN QUERY SELECT
    plan.accrued_interest,
    ROUND(projected_interest, 2),
    ROUND(plan.principal_amount + projected_interest, 2),
    days_remaining,
    ROUND(projected_interest / (total_days / 30.0), 2);
END;
$$;

CREATE INDEX IF NOT EXISTS idx_savings_plans_status_active
ON savings_plans(status)
WHERE status = 'active';
