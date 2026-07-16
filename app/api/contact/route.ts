import { NextResponse } from 'next/server';
import { formatApplicationHtml, sendApplicationEmail } from '@/utils/application-email';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload?.fullName || !payload?.email || !payload?.subject || !payload?.message) {
      return NextResponse.json({ success: false, error: 'Please complete all contact form fields.' }, { status: 400 });
    }

    await sendApplicationEmail({
      subject: `Contact Form - ${payload.subject}`,
      html: formatApplicationHtml('Smart Save Contact Message', {
        fullName: payload.fullName,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send contact message.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

