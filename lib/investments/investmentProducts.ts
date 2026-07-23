export const INVESTMENT_PRODUCTS = [
  {
    name: 'Normal Savings Account',
    description: 'Build consistent wealth through monthly contributions with one payout at month 13.',
    benefits: ['Monthly contributions', '12-month duration', 'Month-13 payout', 'Members only'],
    full: 'A member-only cooperative savings account for fixed monthly contributions over 12 consecutive months, with one payout at month 13.',
    amountField: 'monthlyContribution',
  },
  {
    name: 'Target Savings Plan',
    description: 'Save towards a specific goal with amount, duration, and return agreed at enrollment.',
    benefits: ['Goal savings', 'Agreed duration', 'Full payout at maturity', 'Members and non-members'],
    full: 'A goal-based savings plan for members and non-members. The amount, duration, and return are agreed at enrollment, with full payout at maturity.',
    amountField: 'targetAmount',
  },
  {
    name: 'Fixed Deposit Investment',
    description: 'Deposit a lump sum and earn tiered monthly interest paid quarterly.',
    benefits: ['Lump sum deposit', 'Tiered monthly interest', 'Quarterly payouts', 'Members only'],
    full: 'A fixed investment plan for members who want to place a lump sum for an agreed term, with capital returned in full at maturity.',
    amountField: 'lumpSumAmount',
  },
  {
    name: 'Share Capital Investment',
    description: 'Purchase cooperative shares once and qualify for annual dividends and voting rights.',
    benefits: ['One-time shares', 'Annual dividends', 'Voting rights', 'Members only'],
    full: 'A member-only share capital investment that gives cooperative ownership participation, voting rights, and annual dividend eligibility.',
    amountField: 'amountToInvest',
  },
] as const;

export type InvestmentProductName = (typeof INVESTMENT_PRODUCTS)[number]['name'];

export function findInvestmentProduct(name: string | null | undefined) {
  return INVESTMENT_PRODUCTS.find((product) => product.name === name) || INVESTMENT_PRODUCTS[0];
}
