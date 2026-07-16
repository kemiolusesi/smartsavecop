import nodemailer from 'nodemailer';

type ApplicationPayload = Record<string, unknown>;

function envValue(name: string) {
  return process.env[name]?.trim() || '';
}

export function assertEmailConfig() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ADMIN_EMAIL'];
  const missing = required.filter((name) => !envValue(name));
  if (missing.length) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
}

export function formatApplicationHtml(title: string, payload: ApplicationPayload) {
  const rows = Object.entries(payload)
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (letter) => letter.toUpperCase());
      return `
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:700;background:#fafafa;">${label}</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;">${String(value || 'Not provided')}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;">
      <h1 style="margin:0 0 16px;color:#B48924;">${title}</h1>
      <table style="border-collapse:collapse;width:100%;max-width:760px;">${rows}</table>
    </div>
  `;
}

export async function sendApplicationEmail({
  subject,
  html,
}: {
  subject: string;
  html: string;
}) {
  assertEmailConfig();

  const transporter = nodemailer.createTransport({
    host: envValue('SMTP_HOST'),
    port: Number(envValue('SMTP_PORT')),
    secure: Number(envValue('SMTP_PORT')) === 465,
    auth: {
      user: envValue('SMTP_USER'),
      pass: envValue('SMTP_PASS'),
    },
  });

  await transporter.sendMail({
    from: `"Smart Save Cooperative" <${envValue('SMTP_USER')}>`,
    to: envValue('ADMIN_EMAIL'),
    subject,
    html,
  });
}
