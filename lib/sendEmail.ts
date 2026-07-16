import nodemailer from 'nodemailer';

type EmailTemplate =
  | 'loanApproved'
  | 'loanRejected'
  | 'loanDisbursed'
  | 'withdrawalApproved'
  | 'withdrawalRejected'
  | 'withdrawalTransferred'
  | 'kycApproved'
  | 'kycRejected'
  | 'investmentApproved'
  | 'investmentRejected';

type TemplateInput = {
  name?: string | null;
  amount?: string;
  reason?: string;
  bank?: string;
  account?: string;
  product?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartsavecoop.vercel.app';
const LOGO_URL = `${SITE_URL}/logo.png`;

function envValue(name: string) {
  return process.env[name]?.trim() || '';
}

function formatSubject(template: EmailTemplate) {
  const subjects: Record<EmailTemplate, string> = {
    loanApproved: 'Your Smart Save loan application was approved',
    loanRejected: 'Update on your Smart Save loan application',
    loanDisbursed: 'Your Smart Save loan has been disbursed',
    withdrawalApproved: 'Your Smart Save withdrawal was approved',
    withdrawalRejected: 'Update on your Smart Save withdrawal request',
    withdrawalTransferred: 'Your Smart Save withdrawal has been transferred',
    kycApproved: 'Your Smart Save KYC has been verified',
    kycRejected: 'Action needed on your Smart Save KYC',
    investmentApproved: 'Your Smart Save investment application was approved',
    investmentRejected: 'Update on your Smart Save investment application',
  };

  return subjects[template];
}

function templateBody(template: EmailTemplate, input: TemplateInput) {
  const name = input.name || 'Smart Save member';
  const amount = input.amount || 'the requested amount';
  const reason = input.reason || 'Please contact support for details.';
  const bankLine = input.bank || input.account ? ` Funds will be transferred to ${input.bank || 'your bank'} ${input.account || ''} within 2-3 business days.` : '';
  const product = input.product || 'application';

  const messages: Record<EmailTemplate, string> = {
    loanApproved: `Your loan application for ${amount} has been approved. Our team will contact you with the final disbursement details.`,
    loanRejected: `Your loan application was not approved at this time. Reason: ${reason}`,
    loanDisbursed: `Your loan of ${amount} has been marked as disbursed. Please keep to the agreed repayment schedule.`,
    withdrawalApproved: `Your withdrawal of ${amount} has been approved.${bankLine}`,
    withdrawalRejected: `Your withdrawal request was not approved. Reason: ${reason}`,
    withdrawalTransferred: `Your withdrawal of ${amount} has been marked as transferred. Please confirm receipt with your bank.`,
    kycApproved: 'Your KYC has been verified. Your Smart Save account is now fully active.',
    kycRejected: `Your KYC verification needs attention. Reason: ${reason} Please resubmit corrected documents through the Smart Save support channel.`,
    investmentApproved: `Your ${product} investment application has been approved. Our team will contact you with next steps.`,
    investmentRejected: `Your ${product} investment application was not approved at this time. Reason: ${reason}`,
  };

  return `
    <div style="font-family:Arial,sans-serif;background:#0A0A0A;color:#f8fafc;padding:28px;">
      <div style="max-width:640px;margin:0 auto;border:1px solid rgba(212,175,55,.25);border-radius:14px;overflow:hidden;background:#111;">
        <div style="padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.08);">
          <img src="${LOGO_URL}" alt="Smart Save Cooperative" width="60" style="display:block;width:60px;height:auto;margin:0 0 8px;" />
          <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#D4AF37;font-weight:800;">Smart Save Cooperative</div>
          <h1 style="margin:8px 0 0;font-size:22px;color:#fff;">${formatSubject(template)}</h1>
        </div>
        <div style="padding:24px;color:#d4d4d8;line-height:1.65;font-size:15px;">
          <p>Hello ${name},</p>
          <p>${messages[template]}</p>
          <p style="margin-top:24px;color:#D4AF37;font-weight:700;">Smart Save Cooperative</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendSmartSaveEmail({
  to,
  template,
  data,
}: {
  to?: string | null;
  template: EmailTemplate;
  data?: TemplateInput;
}) {
  if (!to) return { sent: false, skipped: true };

  const host = envValue('SMTP_HOST');
  const port = Number(envValue('SMTP_PORT'));
  const user = envValue('SMTP_USER') || 'smartsavecooperative@gmail.com';
  const pass = envValue('SMTP_PASS');

  if (!host || !port || !user || !pass) {
    return { sent: false, skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Smart Save Cooperative" <${user}>`,
    to,
    subject: formatSubject(template),
    html: templateBody(template, data || {}),
  });

  return { sent: true, skipped: false };
}

export async function sendSmartSaveCustomEmail({
  to,
  subject,
  html,
}: {
  to?: string | null;
  subject: string;
  html: string;
}) {
  if (!to) return { sent: false, skipped: true };

  const host = envValue('SMTP_HOST');
  const port = Number(envValue('SMTP_PORT'));
  const user = envValue('SMTP_USER') || 'smartsavecooperative@gmail.com';
  const pass = envValue('SMTP_PASS');

  if (!host || !port || !user || !pass) {
    return { sent: false, skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Smart Save Cooperative" <${user}>`,
    to,
    subject,
    html,
  });

  return { sent: true, skipped: false };
}
