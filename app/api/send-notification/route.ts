import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendEmail';
import {
  accountActivatedEmail,
  announcementEmail,
  emailSubjects,
  emailVerificationEmail,
  investmentApprovedEmail,
  investmentRejectedEmail,
  loanApprovedEmail,
  loanRejectedEmail,
  passwordResetEmail,
  paymentConfirmedEmail,
  welcomeEmail,
} from '@/lib/email/templates';

type NotificationType =
  | 'loanApproved'
  | 'loanRejected'
  | 'investmentApproved'
  | 'investmentRejected'
  | 'paymentConfirmed'
  | 'accountActivated'
  | 'announcement'
  | 'welcome'
  | 'passwordReset'
  | 'emailVerification';

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function buildEmail(type: NotificationType, memberName: string, details: Record<string, unknown>) {
  const payload = { memberName, ...details };

  const templates: Record<NotificationType, { subject: string; html: string }> = {
    loanApproved: {
      subject: emailSubjects.loanApproved,
      html: loanApprovedEmail(payload),
    },
    loanRejected: {
      subject: emailSubjects.loanRejected,
      html: loanRejectedEmail(payload),
    },
    investmentApproved: {
      subject: emailSubjects.investmentApproved,
      html: investmentApprovedEmail(payload),
    },
    investmentRejected: {
      subject: emailSubjects.investmentRejected,
      html: investmentRejectedEmail(payload),
    },
    paymentConfirmed: {
      subject: emailSubjects.paymentConfirmed,
      html: paymentConfirmedEmail(payload),
    },
    accountActivated: {
      subject: emailSubjects.accountActivated,
      html: accountActivatedEmail(payload),
    },
    announcement: {
      subject: `${String(details.title || 'Smart Save Cooperative Announcement')} — Smart Save Cooperative`,
      html: announcementEmail(payload),
    },
    welcome: {
      subject: emailSubjects.welcome,
      html: welcomeEmail(payload),
    },
    passwordReset: {
      subject: emailSubjects.passwordReset,
      html: passwordResetEmail(payload),
    },
    emailVerification: {
      subject: emailSubjects.emailVerification,
      html: emailVerificationEmail(payload),
    },
  };

  return templates[type];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const to = typeof body.to === 'string' ? body.to.trim() : '';
    const type = typeof body.type === 'string' ? (body.type as NotificationType) : '';
    const memberName = typeof body.memberName === 'string' ? body.memberName.trim() : 'Smart Save member';
    const details = asObject(body.details);

    if (!to || !type) {
      return NextResponse.json({ success: false, error: 'Recipient and notification type are required.' }, { status: 400 });
    }

    const email = buildEmail(type, memberName, details);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Unknown notification type.' }, { status: 400 });
    }

    const result = await sendEmail({ to, subject: email.subject, html: email.html });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as { message?: string } | null)?.message || 'Unable to send notification.' },
      { status: 500 }
    );
  }
}
