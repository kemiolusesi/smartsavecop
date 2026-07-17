type EmailValue = string | number | null | undefined;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartsavecoop.vercel.app';
const LOGO_URL = `${SITE_URL}/logo.png`;

function escapeHtml(value: EmailValue) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(value: EmailValue) {
  const amount = typeof value === 'number' ? value : Number(String(value || 0).replace(/[^\d.-]/g, ''));
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function ctaButton(label: string, href: string) {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${escapeHtml(href)}" style="display:inline-block;background:#D4AF37;color:#111111;text-decoration:none;font-weight:800;border-radius:10px;padding:13px 20px;margin:0 auto;">
        ${escapeHtml(label)}
      </a>
    </div>
  `;
}

function detailRow(label: string, value: EmailValue) {
  return `
    <tr>
      <td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #eeeeee;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#111111;font-size:13px;font-weight:800;text-align:right;border-bottom:1px solid #eeeeee;">${escapeHtml(value || 'Not provided')}</td>
    </tr>
  `;
}

function wrapper(title: string, body: string) {
  return `
    <div style="margin:0;padding:0;background:#111111;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#111111;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:collapse;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="background:#D4AF37;color:#ffffff;padding:18px 22px;text-align:center;font-size:13px;font-weight:900;letter-spacing:0.18em;">
                  <img 
                    src="https://smartsavecop.vercel.app/logo.png"
                    alt="Smart Save Cooperative"
                    width="120"
                    style="display: block; margin: 0 auto 8px auto;"
                  />
                  SMART SAVE COOPERATIVE
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;color:#111111;padding:28px 24px;">
                  <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#111111;">${escapeHtml(title)}</h1>
                  ${body}
                </td>
              </tr>
              <tr>
                <td style="background:#f5f5f5;color:#555555;padding:18px 22px;text-align:center;font-size:12px;line-height:1.7;">
                  Smart Save Cooperative Society | smartsavecooperative@gmail.com
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export const emailSubjects = {
  loanApproved: 'Your Loan Has Been Approved',
  loanRejected: 'Update on Your Loan Application',
  investmentApproved: 'Your Investment Plan Is Now Active',
  investmentRejected: 'Update on Your Investment Application',
  paymentConfirmed: 'Payment Confirmed - Smart Save Cooperative',
  accountActivated: 'Welcome! Your Account Is Now Active',
  announcement: 'Smart Save Cooperative Announcement',
  welcome: 'Welcome to Smart Save Cooperative',
  passwordReset: 'Reset Your Password - Smart Save Cooperative',
  emailVerification: 'Verify Your Email - Smart Save Cooperative',
};

export function loanApprovedEmail({
  memberName,
  loanType,
  amount,
  monthlyPayment,
  tenure,
  startDate,
}: {
  memberName?: EmailValue;
  loanType?: EmailValue;
  amount?: EmailValue;
  monthlyPayment?: EmailValue;
  tenure?: EmailValue;
  startDate?: EmailValue;
}) {
  return wrapper(
    'Your Loan Has Been Approved',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Your loan application has been approved. Log in to view your loan details and repayment schedule.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
        ${detailRow('Loan type', loanType)}
        ${detailRow('Amount', formatCurrency(amount))}
        ${detailRow('Monthly payment', formatCurrency(monthlyPayment))}
        ${detailRow('Tenure', `${tenure || 'Approved'} months`)}
        ${detailRow('Start date', startDate)}
      </table>
      ${ctaButton('Log in to Dashboard', `${SITE_URL}/signin`)}
    `
  );
}

export function loanRejectedEmail({ memberName }: { memberName?: EmailValue }) {
  return wrapper(
    'Update on Your Loan Application',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0;">Your loan application has been reviewed and was not approved at this time. Please log in for details or contact us for support.</p>
    `
  );
}

export function investmentApprovedEmail({
  memberName,
  investmentType,
  amount,
  returnRate,
  maturityDate,
  totalReturn,
}: {
  memberName?: EmailValue;
  investmentType?: EmailValue;
  amount?: EmailValue;
  returnRate?: EmailValue;
  maturityDate?: EmailValue;
  totalReturn?: EmailValue;
}) {
  return wrapper(
    'Your Investment Plan Is Now Active',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Your investment application has been approved and is now active.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
        ${detailRow('Investment type', investmentType)}
        ${detailRow('Amount', formatCurrency(amount))}
        ${detailRow('Return rate', returnRate ? `${returnRate}%` : 'Agreed at approval')}
        ${detailRow('Maturity date', maturityDate)}
        ${detailRow('Total return', formatCurrency(totalReturn))}
      </table>
      ${ctaButton('Log in to Dashboard', `${SITE_URL}/signin`)}
    `
  );
}

export function investmentRejectedEmail({ memberName }: { memberName?: EmailValue }) {
  return wrapper(
    'Update on Your Investment Application',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0;">Your investment application has been reviewed and was not approved at this time. Please log in for details or contact us for support.</p>
    `
  );
}

export function paymentConfirmedEmail({
  memberName,
  amount,
  paymentType,
}: {
  memberName?: EmailValue;
  amount?: EmailValue;
  paymentType?: EmailValue;
}) {
  return wrapper(
    'Payment Confirmed',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Your ${escapeHtml(paymentType || 'payment')} payment has been confirmed.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;">
        ${detailRow('Amount', formatCurrency(amount))}
        ${detailRow('Payment type', paymentType)}
      </table>
    `
  );
}

export function accountActivatedEmail({ memberName }: { memberName?: EmailValue }) {
  return wrapper(
    'Welcome! Your Account Is Now Active',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Welcome to Smart Save Cooperative. Your account is now active and you can access your dashboard.</p>
      ${ctaButton('Log in to Dashboard', 'https://smartsavecoop.vercel.app/signin')}
    `
  );
}

export function announcementEmail({
  memberName,
  title,
  body,
}: {
  memberName?: EmailValue;
  title?: EmailValue;
  body?: EmailValue;
}) {
  const safeBody = escapeHtml(body).replace(/\n/g, '<br />');

  return `
    <div style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,Helvetica,sans-serif;color:#f8fafc;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#0A0A0A;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border-collapse:collapse;border:1px solid rgba(212,175,55,.28);border-radius:18px;overflow:hidden;background:#111111;">
              <tr>
                <td style="padding:24px 24px 18px;text-align:center;background:#111111;">
                  <img 
                    src="https://smartsavecop.vercel.app/logo.png"
                    alt="Smart Save Cooperative"
                    width="120"
                    style="display: block; margin: 0 auto 8px auto;"
                  />
                  <p style="margin:0;font-size:12px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#D4AF37;">SMART SAVE COOPERATIVE</p>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 26px;background:#0F0F0F;">
                  <p style="margin:0 0 12px;font-size:12px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#D4AF37;">NEW ANNOUNCEMENT</p>
                  <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#ffffff;">${escapeHtml(title || 'Smart Save Announcement')}</h1>
                  <p style="margin:0 0 18px;color:#d4d4d8;font-size:15px;line-height:1.75;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
                  <div style="color:#d4d4d8;font-size:15px;line-height:1.75;">${safeBody}</div>
                  <div style="height:1px;background:#D4AF37;margin:24px 0;"></div>
                  <p style="margin:0 0 8px;color:#d4d4d8;font-size:15px;line-height:1.7;">Log in to view and respond:</p>
                  <div style="text-align: center; margin: 32px 0;">
                    ${ctaButton('Open My Dashboard', 'https://smartsavecoop.vercel.app/signin')}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#111111;color:#9ca3af;padding:18px 22px;text-align:center;font-size:12px;line-height:1.7;">
                  Smart Save Cooperative Society | smartsavecooperative@gmail.com
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export function welcomeEmail({ memberName }: { memberName?: EmailValue }) {
  return wrapper(
    'Welcome to Smart Save Cooperative',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Your Smart Save profile has been created. Next, verify your email, complete onboarding, and submit your payment proof for admin review.</p>
    `
  );
}

export function passwordResetEmail({
  memberName,
  resetLink,
}: {
  memberName?: EmailValue;
  resetLink?: string;
}) {
  return wrapper(
    'Reset Your Password',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Click the button below to reset your password. This link expires in 1 hour.</p>
      ${ctaButton('Reset Password', resetLink || `${SITE_URL}/reset-password`)}
      <p style="font-size:13px;line-height:1.7;color:#6b7280;margin:22px 0 0;">If you did not request this, ignore this email.</p>
    `
  );
}

export function emailVerificationEmail({
  memberName,
  verificationLink,
}: {
  memberName?: EmailValue;
  verificationLink?: string;
}) {
  return wrapper(
    'Verify Your Email',
    `
      <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">Hello ${escapeHtml(memberName || 'Smart Save member')},</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">Please verify your email address to complete your Smart Save Cooperative registration.</p>
      ${ctaButton('Verify Email', verificationLink || `${SITE_URL}/auth/callback`)}
    `
  );
}
