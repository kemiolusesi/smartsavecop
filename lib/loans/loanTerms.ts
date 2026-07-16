export type LoanRepaymentOption = 'Monthly interest payment only' | 'Monthly principal + interest';
export type LoanRepaymentOptionCode = 'interest_only' | 'principal_interest';

export type LoanTerm = {
  name: string;
  rate: number;
  months: number;
  tenure: string;
  suitable: string;
};

export const REPAYMENT_OPTIONS: LoanRepaymentOption[] = [
  'Monthly interest payment only',
  'Monthly principal + interest',
];

export function normalizeRepaymentOption(repaymentOption: string | null | undefined): LoanRepaymentOptionCode {
  const normalized = String(repaymentOption || '').trim().toLowerCase();
  if (normalized === 'interest_only' || normalized === 'monthly interest payment only') return 'interest_only';
  return 'principal_interest';
}

export function repaymentOptionLabel(repaymentOption: string | null | undefined): LoanRepaymentOption {
  return normalizeRepaymentOption(repaymentOption) === 'interest_only'
    ? 'Monthly interest payment only'
    : 'Monthly principal + interest';
}

export const SMART_SAVE_LOAN_TERMS: LoanTerm[] = [
  {
    name: 'Normal Loan',
    rate: 10,
    months: 3,
    tenure: '3 months',
    suitable: 'Personal emergencies, school fees, business support, household expenses',
  },
  {
    name: 'Special Loan',
    rate: 15,
    months: 3,
    tenure: '3 months',
    suitable: 'Business expansion, contract execution, capital-intensive projects',
  },
  {
    name: 'Products Loan',
    rate: 20,
    months: 3,
    tenure: '3 months',
    suitable: 'Cooperative products, business equipment, specialized purchases',
  },
  {
    name: 'Electronics Loan',
    rate: 3,
    months: 12,
    tenure: 'Up to 12 months',
    suitable: 'TVs, fridges, ACs, freezers, computers, solar systems, and other approved electronics',
  },
  {
    name: 'Festival Loan',
    rate: 10,
    months: 3,
    tenure: '3 months',
    suitable: 'Christmas, Eid, New Year, family ceremonies',
  },
];

export function getLoanTerm(loanType: string | null | undefined) {
  const normalized = String(loanType || '').trim().toLowerCase();
  return SMART_SAVE_LOAN_TERMS.find((term) => term.name.toLowerCase() === normalized) || SMART_SAVE_LOAN_TERMS[0];
}

export function calculateLoanRepayment(
  amount: number,
  loanType: string | null | undefined,
  repaymentOption: string | null | undefined
) {
  const term = getLoanTerm(loanType);
  const principal = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const totalInterest = principal * (term.rate / 100) * term.months;
  const totalRepayable = principal + totalInterest;
  const interestOnly = normalizeRepaymentOption(repaymentOption) === 'interest_only';
  const monthlyPayment = interestOnly ? principal * (term.rate / 100) : totalRepayable / term.months;
  const finalPayment = interestOnly ? principal + monthlyPayment : monthlyPayment;

  return {
    term,
    principal,
    totalInterest,
    totalRepayable,
    monthlyPayment,
    finalPayment,
  };
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
