import LegalPage from '@/components/legal/LegalPage';

export default function CompliancePage() {
  return (
    <LegalPage
      title="Regulatory Compliance"
      sections={[
        {
          title: 'Fully Registered Cooperative',
          body: 'Smart Save Cooperative operates as a registered cooperative society and maintains appropriate organizational records for accountable member-focused financial activity.',
        },
        {
          title: 'KYC and AML',
          body: 'Know Your Customer and Anti-Money Laundering procedures are part of our onboarding, transaction review, loan assessment, and account-monitoring processes.',
        },
        {
          title: 'Data Protection',
          body: 'Smart Save Cooperative handles member information in line with Nigeria Data Protection Regulation principles, including lawful use, limited access, retention controls, and member rights.',
        },
        {
          title: 'Compliance Contact',
          body: 'For compliance questions, contact Smart Save Cooperative at smartsavecooperative@gmail.com.',
        },
      ]}
    />
  );
}
