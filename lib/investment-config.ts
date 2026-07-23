export const FIXED_TIER_1_MIN = 500000;
export const FIXED_TIER_1_MAX = 1000000;
export const FIXED_TIER_2_MIN = 1100000;
export const FIXED_TIER_2_MAX = 5000000;

export const FIXED_TIER_1_MONTHLY_RATE = 0.015;
export const FIXED_TIER_2_MONTHLY_RATE = 0.02;

export const FIXED_PAYOUT_INTERVAL_MONTHS = 3;
export const SAVINGS_RETURN_RATE = 0.15;
export const SAVINGS_DURATION_MONTHS = 12;
export const SAVINGS_PAYOUT_MONTH = 13;

export type FixedInvestmentTier = {
  name: string;
  min: number;
  max: number;
  monthlyRate: number;
};

export const FIXED_INVESTMENT_TIERS: FixedInvestmentTier[] = [
  {
    name: 'Tier 1',
    min: FIXED_TIER_1_MIN,
    max: FIXED_TIER_1_MAX,
    monthlyRate: FIXED_TIER_1_MONTHLY_RATE,
  },
  {
    name: 'Tier 2',
    min: FIXED_TIER_2_MIN,
    max: FIXED_TIER_2_MAX,
    monthlyRate: FIXED_TIER_2_MONTHLY_RATE,
  },
];

export function getFixedInvestmentTier(amount: number) {
  return FIXED_INVESTMENT_TIERS.find((tier) => amount >= tier.min && amount <= tier.max) || null;
}

export function calculateFixedQuarterlyInterest(amount: number) {
  const tier = getFixedInvestmentTier(amount);
  return tier ? amount * tier.monthlyRate * FIXED_PAYOUT_INTERVAL_MONTHS : 0;
}

export function calculateFixedTotalInterest(amount: number, months: number) {
  const tier = getFixedInvestmentTier(amount);
  return tier ? amount * tier.monthlyRate * months : 0;
}

export function calculateFixedTotalPayout(amount: number, months: number) {
  return amount + calculateFixedTotalInterest(amount, months);
}

export function calculateSavingsTotalContributed(monthlyContribution: number) {
  return monthlyContribution * SAVINGS_DURATION_MONTHS;
}

export function calculateSavingsPayout(monthlyContribution: number) {
  return calculateSavingsTotalContributed(monthlyContribution) * (1 + SAVINGS_RETURN_RATE);
}
