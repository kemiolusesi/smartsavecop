import LegalPage from '@/components/legal/LegalPage';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="July 2026"
      sections={[
        {
          title: 'What Data We Collect',
          body: 'We collect information needed to operate a trusted cooperative platform, including member names, email addresses, phone numbers, identity verification details, identification documents, onboarding information, account records, transaction history, and support communications.',
        },
        {
          title: 'How We Use Your Data',
          body: 'Your information is used for account management, KYC verification, regulatory compliance, service delivery, fraud prevention, transaction processing, member support, and improving Smart Save Cooperative services.',
        },
        {
          title: 'Data Sharing',
          body: 'We do not sell member data to third parties. Information may only be shared with service providers that support our operations or with regulatory bodies where required by CBN, NDIC, cooperative, tax, or law-enforcement obligations.',
        },
        {
          title: 'Data Security',
          body: 'We use secure access controls, encrypted storage where applicable, administrative safeguards, and controlled operational processes to protect member records from unauthorized access, loss, misuse, or disclosure.',
        },
        {
          title: 'Member Rights',
          body: 'Members may request access to their information, correction of inaccurate details, or deletion where legally permissible. Some records may be retained where required for cooperative, compliance, or regulatory purposes.',
        },
        {
          title: 'Privacy Contact',
          body: 'For privacy questions or data requests, contact Smart Save Cooperative at smartsavecooperative@gmail.com.',
        },
      ]}
    />
  );
}
