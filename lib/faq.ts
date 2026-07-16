import { BANK_DETAILS } from '@/lib/constants/bankDetails';

export type FaqCategory = 'Payments & Bank Details' | 'Membership' | 'Savings' | 'Loans' | 'Investments & Dividends' | 'General';

export type FaqItem = {
  question: string;
  answer: string;
  category: FaqCategory;
  bankDetails?: typeof BANK_DETAILS;
};

export const FAQS: FaqItem[] = [
  {
    category: 'Payments & Bank Details',
    question: 'How do I make a payment or deposit?',
    answer:
      'All payments are made via direct bank transfer to our cooperative account. Transfer the required amount and submit your transaction reference through the app for admin confirmation. Your account will be updated within 24 hours.',
  },
  {
    category: 'Payments & Bank Details',
    question: "What are Smart Save Cooperative's bank details?",
    answer: `Account Name: ${BANK_DETAILS.accountName} | Bank: ${BANK_DETAILS.bankName} | Account Number: ${BANK_DETAILS.accountNumber} | Account Type: ${BANK_DETAILS.accountType}. Please ensure you transfer the exact amount required.`,
    bankDetails: BANK_DETAILS,
  },
  {
    category: 'Payments & Bank Details',
    question: 'How long does it take for my payment to be confirmed?',
    answer:
      'Once you submit your transaction reference, our admin team reviews and confirms payments within 24 hours on business days.',
  },
  {
    category: 'Payments & Bank Details',
    question: 'What should I do after making a transfer?',
    answer:
      'Log into your dashboard, go to the deposit section (or complete your onboarding), enter your transaction reference number from your bank, and submit. Do not close the app before submitting your reference.',
  },
  {
    category: 'Payments & Bank Details',
    question: 'What if my payment is not confirmed after 24 hours?',
    answer:
      'Contact us at smartsavecooperative@gmail.com with your transaction reference number and we will resolve it promptly.',
  },
  {
    category: 'Membership',
    question: 'What is Smart Save Cooperative Society?',
    answer:
      'Smart Save Cooperative Society is a member-focused financial cooperative that helps individuals, families, entrepreneurs, and businesses build financial stability through disciplined savings, accessible loans, investment opportunities, and cooperative support. We exist to make saving easier, improve access to responsible credit, and help members work toward long-term financial growth together.',
  },
  {
    category: 'Membership',
    question: 'Who can become a member?',
    answer:
      'Membership is open to individuals, business owners, salary earners, entrepreneurs, students, and groups who are willing to save consistently, follow cooperative guidelines, and participate responsibly in the Smart Save community. Prospective members may be required to complete registration, provide valid identification, and meet any onboarding requirements set by the cooperative.',
  },
  {
    category: 'Membership',
    question: 'How do I join Smart Save Cooperative?',
    answer:
      'You can join by creating an account, completing the membership registration process, submitting the required information, and following the onboarding steps provided. Once your details are reviewed and your membership is activated, you can begin saving, tracking your progress, and accessing eligible cooperative services.',
  },
  {
    category: 'Membership',
    question: 'What documents are required for membership?',
    answer:
      'Typical membership requirements may include a valid government-issued ID, recent passport photograph, contact details, residential or business address, next-of-kin information, and any additional verification documents requested during onboarding. These requirements help us protect members and maintain a trusted cooperative environment.',
  },
  {
    category: 'Membership',
    question: 'Can I transfer my membership?',
    answer:
      'Membership is personal to each registered member and generally cannot be transferred without formal approval from the cooperative. If a member needs to update ownership details, assign benefits, or handle a special circumstance, the request should be submitted to Smart Save support for review in line with cooperative policy.',
  },
  {
    category: 'Savings',
    question: 'Is my money safe with Smart Save Cooperative?',
    answer:
      'Smart Save Cooperative is built around trust, transparency, and responsible financial management. Member savings are handled through structured cooperative processes, account records, and internal controls designed to protect funds and keep members informed. As with any financial commitment, members should review the cooperative terms and ask questions before choosing a savings plan.',
  },
  {
    category: 'Savings',
    question: 'What savings products do you offer?',
    answer:
      'Smart Save Cooperative offers flexible savings options designed for different goals, including regular savings, target savings, project savings, business savings, and longer-term savings plans. Available products may vary over time, but each plan is designed to support consistency, discipline, and measurable financial progress.',
  },
  {
    category: 'Savings',
    question: 'How much can I save monthly?',
    answer:
      'Members can choose a monthly savings amount that fits their income, goals, and selected plan. Smart Save encourages realistic and consistent contributions, whether small or large, because regular saving is often the foundation for stronger financial outcomes. Some plans may have minimum contribution requirements.',
  },
  {
    category: 'Savings',
    question: 'Can I withdraw my savings at any time?',
    answer:
      'Withdrawal access depends on the savings product or plan you choose. Some plans may allow flexible withdrawals, while target or fixed-term plans may require members to wait until a maturity date or follow specific withdrawal conditions. This structure helps members stay committed to their goals while keeping the cooperative financially stable.',
  },
  {
    category: 'Savings',
    question: 'Do savings attract interest or returns?',
    answer:
      'Some Smart Save savings or investment-linked plans may attract returns, rewards, or dividends depending on the plan terms, cooperative performance, and applicable policies. Returns are not the same for every product, so members should review the details of each plan before committing funds.',
  },
  {
    category: 'Loans',
    question: 'Can members obtain loans?',
    answer:
      'Yes. Eligible Smart Save Cooperative members may apply for loans after meeting the cooperative requirements. Loan access is usually based on membership status, savings history, repayment capacity, documentation, and compliance with the cooperative loan policy.',
  },
  {
    category: 'Loans',
    question: 'What types of loans are available?',
    answer:
      'Smart Save may provide different loan options for personal needs, business support, emergency expenses, education, asset financing, and other approved purposes. Loan availability and terms can vary, and every application is reviewed to ensure the facility is responsible and suitable for the member.',
  },
  {
    category: 'Loans',
    question: 'How long does loan approval take?',
    answer:
      'Loan approval timelines depend on the completeness of your application, verification requirements, guarantor checks where applicable, and internal review. Simple applications may move faster, while larger or more complex requests may take additional time for proper assessment.',
  },
  {
    category: 'Loans',
    question: 'Do I need a guarantor to obtain a loan?',
    answer:
      'A guarantor may be required for some loan products, especially where the loan amount, repayment period, or risk profile requires additional assurance. The cooperative will let you know whether a guarantor is needed during the application process.',
  },
  {
    category: 'Loans',
    question: 'What happens if I default on my loan repayment?',
    answer:
      'If a member defaults, Smart Save Cooperative may apply late fees, restrict future loan access, contact guarantors where applicable, recover from eligible savings or benefits, and take other steps allowed under the loan agreement. Members are encouraged to contact the cooperative early if repayment difficulties arise.',
  },
  {
    category: 'Loans',
    question: 'Can non-members access loans?',
    answer:
      'Loans are generally reserved for registered and eligible members of Smart Save Cooperative. Non-members who are interested in loan access should first complete the membership process and build the required savings or participation history.',
  },
  {
    category: 'Investments & Dividends',
    question: 'How are dividends shared?',
    answer:
      'Dividends are shared according to cooperative policy, member participation, savings or investment records, and the financial performance of eligible cooperative activities. The exact distribution method may vary by year or product and is communicated to members through official cooperative channels.',
  },
  {
    category: 'Investments & Dividends',
    question: 'Can I invest through Smart Save Cooperative?',
    answer:
      'Yes. Smart Save Cooperative may provide investment opportunities or investment-linked savings plans that allow members to participate in approved cooperative projects. Members should review the terms, expected timeline, risk information, and return structure before investing.',
  },
  {
    category: 'General',
    question: 'How can I contact Smart Save Cooperative?',
    answer:
      'You can contact Smart Save Cooperative by email at smartsavecooperative@gmail.com, call +234 903 421 4726 or +234 903 543 1380, or chat on WhatsApp at +234 901 019 8072.',
  },
  {
    category: 'General',
    question: 'Why should I choose Smart Save Cooperative?',
    answer:
      'Smart Save Cooperative is designed for people who want a structured, community-driven way to save, access responsible financial support, and build long-term stability. Members benefit from disciplined savings tools, cooperative accountability, transparent communication, and services built around practical financial goals.',
  },
];

export const FAQ_CATEGORIES: FaqCategory[] = [
  'Payments & Bank Details',
  'Membership',
  'Savings',
  'Loans',
  'Investments & Dividends',
  'General',
];
