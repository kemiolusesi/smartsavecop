const FROM_ADDRESS = 'Smart Save Cooperative <onboarding@resend.dev>';

type ResendClientConstructor = new (apiKey: string) => {
  emails: {
    send(args: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }): Promise<{ error?: { message?: string } | null }>;
  };
};

async function loadResend() {
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string
  ) => Promise<{ Resend: ResendClientConstructor }>;

  return dynamicImport('resend');
}

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
    const { Resend } = await loadResend();
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      const message = error.message || 'Unable to send email.';
      console.error('Resend email API failed:', message, error);
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
