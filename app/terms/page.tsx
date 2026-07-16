import LegalPage from '@/components/legal/LegalPage';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="July 2026"
      sections={[
        {
          title: 'Membership Eligibility',
          body: 'Membership is open to eligible individuals and businesses that complete registration, provide accurate information, submit required documents, and agree to Smart Save Cooperative policies.',
        },
        {
          title: 'Registration Fee',
          body: 'A non-refundable registration fee of ₦5,000 applies to membership registration unless otherwise stated in an approved promotion or cooperative communication.',
        },
        {
          title: 'Savings Conditions',
          body: 'Members are expected to make minimum contributions according to their selected plan. Withdrawals may be made once per quarter, and the maximum withdrawal is 60% of total contributions, subject to review and cooperative procedures.',
        },
        {
          title: 'Loan Terms',
          body: 'Loans are subject to guarantor requirements, published interest rates, repayment capacity, documentation, savings history, and final approval at the discretion of Smart Save Cooperative.',
        },
        {
          title: 'Investment Terms',
          body: 'Investment returns are subject to cooperative performance, market conditions, selected product terms, and approved distribution policies. Returns are projected for guidance and are not guaranteed.',
        },
        {
          title: 'Member Responsibilities',
          body: 'Members must provide accurate information, keep contact details current, make agreed contributions, repay loans promptly, protect account access, and comply with cooperative rules.',
        },
        {
          title: 'Termination and Exit',
          body: 'A member may exit the cooperative subject to applicable notice, account reconciliation, outstanding loan recovery, investment maturity terms, and any obligations under cooperative policy.',
        },
        {
          title: 'Governing Law',
          body: 'These terms are governed by the laws of the Federal Republic of Nigeria and applicable cooperative, financial, and data protection regulations.',
        },
      ]}
    />
  );
}

