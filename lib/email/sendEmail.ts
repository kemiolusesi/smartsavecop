const FROM_ADDRESS = 'Smart Save Cooperative <onboarding@resend.dev>';
const RESEND_EMAILS_API = 'https://api.resend.com/emails';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to?: string | null;
  subject: string;
  html: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return { success: false, error: 'Email service not configured' };
    }

    if (!to) {
      return { success: false, error: 'Recipient email is required.' };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const response = await fetch(RESEND_EMAILS_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : 'Unable to send email.';
      console.error('Resend email API failed:', message, payload);
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error) {
    console.error('Resend email send failed:', error);
    return {
      success: false,
      error: (error as { message?: string } | null)?.message || 'Unable to send email.',
    };
  }
}
