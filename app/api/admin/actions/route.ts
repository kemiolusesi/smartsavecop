import { NextResponse } from 'next/server';
import { jsonError, logAdminAction, parseMoney, requireAdmin, type AdminContext } from '@/lib/admin-auth';
import { sendSmartSaveCustomEmail, sendSmartSaveEmail } from '@/lib/sendEmail';
import { addMonths, calculateLoanRepayment } from '@/lib/loans/loanTerms';
import { sendEmail } from '@/lib/email/sendEmail';
import {
  accountActivatedEmail,
  emailSubjects,
  investmentApprovedEmail,
  investmentRejectedEmail,
  loanApprovedEmail,
  loanRejectedEmail,
  paymentConfirmedEmail,
} from '@/lib/email/templates';

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function formatNaira(value: unknown) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(parseMoney(value));
}

function reference(prefix: string) {
  return `SS-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function emailSafely(args: Parameters<typeof sendSmartSaveEmail>[0]) {
  try {
    await sendSmartSaveEmail(args);
  } catch {
    // Email delivery is best-effort for admin actions.
  }
}

async function customEmailSafely(args: Parameters<typeof sendSmartSaveCustomEmail>[0]) {
  try {
    await sendSmartSaveCustomEmail(args);
  } catch {
    // Email delivery is best-effort for admin actions.
  }
}

async function resendEmailSafely(args: { to?: string | null; subject: string; html: string }) {
  try {
    const result = await sendEmail(args);
    void result;
  } catch {
    // Email delivery is best-effort for admin actions.
  }
}

async function notifyUserSafely(
  context: AdminContext,
  userId: string | null | undefined,
  title: string,
  message: string,
  type: string
) {
  if (!userId) return;

  try {
    const { error } = await context.supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
    });

    void error;
  } catch {
    // Notifications are best-effort for admin actions.
  }
}

async function adminActivitySafely(
  context: AdminContext,
  {
    actionType,
    targetUserId,
    targetUserEmail,
    entityType,
    entityId,
    details,
  }: {
    actionType: string;
    targetUserId?: string | null;
    targetUserEmail?: string | null;
    entityType: 'payment' | 'loan' | 'investment' | 'account' | 'kyc' | 'withdrawal' | 'announcement' | 'settings' | 'transaction';
    entityId?: string | null;
    details?: Record<string, unknown>;
  }
) {
  try {
    const { error } = await context.supabase.from('admin_activity_log').insert({
      admin_id: context.adminId,
      admin_email: context.adminProfile?.email || null,
      action_type: actionType,
      target_user_id: targetUserId || null,
      target_user_email: targetUserEmail || null,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || {},
    });

    void error;
  } catch {
    // Activity logging is best-effort for admin actions.
  }
}

async function profileByUserId(context: AdminContext, userId: string | null | undefined) {
  if (!userId) return null;

  const { data } = await context.supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return data;
}

async function updateApplicationStatus(
  context: AdminContext,
  table: 'loan_applications' | 'investment_applications',
  id: string,
  status: string,
  reason?: string,
  extra: Record<string, unknown> = {}
) {
  const reviewedAt = new Date().toISOString();
  const approvingLoan = table === 'loan_applications' && status === 'approved';
  const approvingInvestment = table === 'investment_applications' && status === 'approved';
  const payload: Record<string, unknown> = {
    status: approvingLoan || approvingInvestment ? 'active' : status,
    reviewed_at: reviewedAt,
    reviewed_by: context.adminId,
  };
  if (reason) payload.rejection_reason = reason;

  if (approvingLoan) {
    const { data: loan, error: lookupError } = await context.supabase
      .from('loan_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (lookupError) throw lookupError;

    const requestedAmount = parseMoney(loan.amount_requested || loan.amount_approved);
    const repayment = calculateLoanRepayment(requestedAmount, loan.loan_type, loan.repayment_option);
    const startDate = new Date();
    const endDate = addMonths(startDate, repayment.term.months);

    payload.amount_approved = requestedAmount;
    payload.start_date = startDate.toISOString();
    payload.end_date = endDate.toISOString();
    payload.monthly_payment = repayment.monthlyPayment;
    payload.total_repayable = repayment.totalRepayable;
    payload.interest_rate = repayment.term.rate;
    payload.tenure_months = repayment.term.months;
    payload.approved_at = reviewedAt;
  }
  if (approvingInvestment) {
    payload.agreed_return_rate = parseMoney(extra.agreedReturnRate);
    payload.start_date = asString(extra.startDate) || reviewedAt;
    payload.maturity_date = asString(extra.maturityDate) || null;
    payload.total_return_amount = parseMoney(extra.totalReturnAmount);
    payload.approved_at = reviewedAt;
  }

  const { data, error } = await context.supabase
    .from(table)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  const member = await profileByUserId(context, data.user_id);
  if (table === 'loan_applications') {
    if (status === 'approved') {
      await notifyUserSafely(
        context,
        data.user_id,
        'Loan Approved!',
        `Your ${data.loan_type || 'loan'} loan of ${formatNaira(data.amount_approved || data.amount_requested)} has been approved. Check your loans page for repayment details.`,
        'success'
      );
      await resendEmailSafely({
        to: member?.email,
        subject: emailSubjects.loanApproved,
        html: loanApprovedEmail({
          memberName: member?.full_name,
          loanType: data.loan_type,
          amount: data.amount_approved || data.amount_requested,
          monthlyPayment: data.monthly_payment,
          tenure: data.tenure_months,
          startDate: data.start_date ? new Date(data.start_date).toLocaleDateString('en-NG') : '',
        }),
      });
    } else if (status === 'rejected') {
      await notifyUserSafely(
        context,
        data.user_id,
        'Loan Application Update',
        'Your loan application has been reviewed. Contact us at smartsavecooperative@gmail.com for details.',
        'info'
      );
      await resendEmailSafely({
        to: member?.email,
        subject: emailSubjects.loanRejected,
        html: loanRejectedEmail({ memberName: member?.full_name }),
      });
    } else if (status === 'disbursed') {
      await emailSafely({ to: member?.email, template: 'loanDisbursed', data: { name: member?.full_name, amount: formatNaira(data.amount_approved || data.amount_requested) } });
      await context.supabase.from('transactions').insert({
        user_id: data.user_id,
        amount: data.amount_approved || data.amount_requested || 0,
        type: 'loan_disbursement',
        status: 'approved',
        loan_id: data.id,
        reference: reference('LND'),
        description: `Loan disbursement for ${data.loan_type || 'approved loan'}`,
      });
    }
  } else if (status === 'approved') {
    await notifyUserSafely(
      context,
      data.user_id,
      'Investment Active!',
      `Your ${data.investment_type || 'investment'} of ${formatNaira(data.amount)} is now active. Check your investments page for details.`,
      'success'
    );
    await resendEmailSafely({
      to: member?.email,
      subject: emailSubjects.investmentApproved,
      html: investmentApprovedEmail({
        memberName: member?.full_name,
        investmentType: data.investment_type,
        amount: data.amount,
        returnRate: data.agreed_return_rate,
        maturityDate: data.maturity_date ? new Date(data.maturity_date).toLocaleDateString('en-NG') : '',
        totalReturn: data.total_return_amount,
      }),
    });
  } else if (status === 'rejected') {
    await notifyUserSafely(
      context,
      data.user_id,
      'Investment Application Update',
      'Your investment application has been reviewed. Contact us at smartsavecooperative@gmail.com',
      'info'
    );
    await resendEmailSafely({
      to: member?.email,
      subject: emailSubjects.investmentRejected,
      html: investmentRejectedEmail({ memberName: member?.full_name }),
    });
  }

  const actionType =
    table === 'loan_applications'
      ? `loan_${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status}`
      : `investment_${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status}`;
  await adminActivitySafely(context, {
    actionType,
    targetUserId: data.user_id,
    targetUserEmail: member?.email,
    entityType: table === 'loan_applications' ? 'loan' : 'investment',
    entityId: data.id,
    details: {
      amount: table === 'loan_applications' ? data.amount_approved || data.amount_requested : data.amount,
      type: table === 'loan_applications' ? data.loan_type : data.investment_type,
      status,
      reason,
    },
  });
  await logAdminAction(context, `${table}.${status}`, data.user_id, { id, reason });
  return data;
}

export async function POST(request: Request) {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  try {
    const body = await request.json();
    const action = asString(body.action);

    if (action === 'approveKyc' || action === 'rejectKyc') {
      const userId = asString(body.userId);
      const reason = asString(body.reason);
      if (!userId) return jsonError('Member is required.');
      if (action === 'rejectKyc' && !reason) return jsonError('Rejection reason is required.');

      const status = action === 'approveKyc' ? 'approved' : 'rejected';
      const update: Record<string, unknown> = {
        kyc_status: status,
        kyc_verified_at: status === 'approved' ? new Date().toISOString() : null,
        kyc_rejection_reason: reason || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await context.supabase
        .from('profiles')
        .update(update)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;

      await emailSafely({
        to: data.email,
        template: status === 'approved' ? 'kycApproved' : 'kycRejected',
        data: { name: data.full_name, reason },
      });
      await logAdminAction(context, `kyc.${status}`, userId, { reason });
      return NextResponse.json({ success: true, data });
    }

    if (action === 'identityStatus') {
      return jsonError('Identity verification is coming soon.', 503);
    }

    if (action === 'approveMember' || action === 'rejectMember') {
      const userId = asString(body.userId);
      const reason = asString(body.reason);
      if (!userId) return jsonError('Member is required.');
      if (action === 'rejectMember' && !reason) return jsonError('Rejection reason is required.');

      const status = action === 'approveMember' ? 'approved' : 'rejected';
      const now = new Date().toISOString();
      const { data, error } = await context.supabase
        .from('profiles')
        .update({
          approval_status: status,
          kyc_status: status,
          kyc_verified_at: status === 'approved' ? now : null,
          kyc_rejection_reason: status === 'rejected' ? reason : null,
          updated_at: now,
        })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      if (status === 'approved') {
        await customEmailSafely({
          to: data.email,
          subject: 'Welcome to Smart Save Cooperative!',
          html: `
            <div style="font-family:Arial,sans-serif;background:#0A0A0A;color:#f8fafc;padding:28px;">
              <div style="max-width:640px;margin:0 auto;border:1px solid rgba(212,175,55,.25);border-radius:14px;background:#111;padding:24px;">
                <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#D4AF37;font-weight:800;">Smart Save Cooperative</p>
                <h1 style="color:#fff;">Welcome to Smart Save Cooperative!</h1>
                <p style="color:#d4d4d8;line-height:1.7;">Dear ${data.full_name || 'Smart Save member'}, your application has been approved! You can now log in to access your member dashboard at ${siteUrl || 'the Smart Save portal'}/signin. Welcome to the Smart Save family!</p>
              </div>
            </div>
          `,
        });
      } else {
        await customEmailSafely({
          to: data.email,
          subject: 'Update on your Smart Save Cooperative application',
          html: `
            <div style="font-family:Arial,sans-serif;background:#0A0A0A;color:#f8fafc;padding:28px;">
              <div style="max-width:640px;margin:0 auto;border:1px solid rgba(212,175,55,.25);border-radius:14px;background:#111;padding:24px;">
                <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#D4AF37;font-weight:800;">Smart Save Cooperative</p>
                <h1 style="color:#fff;">Application Update</h1>
                <p style="color:#d4d4d8;line-height:1.7;">Dear ${data.full_name || 'Smart Save member'}, your application was not approved at this time.</p>
                <p style="color:#d4d4d8;line-height:1.7;"><strong>Reason:</strong> ${reason}</p>
                <p style="color:#d4d4d8;line-height:1.7;">Please contact Smart Save Cooperative for clarification or next steps.</p>
              </div>
            </div>
          `,
        });
      }

      await logAdminAction(context, `member.${status}`, userId, { reason });
      return NextResponse.json({ success: true, data });
    }

    if (action === 'activateMember' || action === 'deactivateMember') {
      const userId = asString(body.userId);
      if (!userId) return jsonError('Member is required.');

      const activating = action === 'activateMember';
      const now = new Date().toISOString();
      const update: Record<string, unknown> = {
        is_active: activating,
        approval_status: activating ? 'approved' : 'pending',
        updated_at: now,
      };
      if (activating) {
        update.has_paid = true;
        update.activated_at = now;
      } else {
        update.deactivated_at = now;
      }

      const { data, error } = await context.supabase
        .from('profiles')
        .update(update)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;

      if (activating) {
        await resendEmailSafely({
          to: data.email,
          subject: emailSubjects.accountActivated,
          html: accountActivatedEmail({ memberName: data.full_name }),
        });
        await notifyUserSafely(
          context,
          data.user_id,
          'Account Activated!',
          'Welcome to Smart Save Cooperative! Your membership is now active. Log in to access your dashboard.',
          'success'
        );
      } else {
        await notifyUserSafely(
          context,
          data.user_id,
          'Account Status Update',
          'Your account status has changed. Please contact smartsavecooperative@gmail.com for assistance.',
          'warning'
        );
      }

      await adminActivitySafely(context, {
        actionType: activating ? 'account_activated' : 'account_deactivated',
        targetUserId: data.user_id,
        targetUserEmail: data.email,
        entityType: 'account',
        entityId: data.user_id,
        details: { status: activating ? 'activated' : 'deactivated' },
      });
      await logAdminAction(context, activating ? 'member.activate' : 'member.deactivate', userId);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'paymentSubmissionStatus') {
      const id = asString(body.id);
      const status = asString(body.status);
      const reason = asString(body.reason);
      if (!id) return jsonError('Payment submission is required.');
      if (!['approved', 'rejected'].includes(status)) return jsonError('Status must be approved or rejected.');
      if (status === 'rejected' && !reason) return jsonError('Rejection reason is required.');

      const reviewedAt = new Date().toISOString();
      const { data: payment, error: paymentLookupError } = await context.supabase
        .from('payment_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (paymentLookupError) throw paymentLookupError;
      let paymentMember: any = null;

      if (status === 'approved') {
        const paymentType = String(payment.payment_type || '').toLowerCase();
        const amount = parseMoney(payment.amount);

        if (paymentType === 'registration') {
          paymentMember = await profileByUserId(context, payment.user_id);
          const { error: profileError } = await context.supabase
            .from('profiles')
            .update({
              has_paid: true,
              is_active: true,
              approval_status: 'approved',
              activated_at: reviewedAt,
              updated_at: reviewedAt,
            })
            .eq('user_id', payment.user_id);

          if (profileError) throw profileError;
        } else if (paymentType === 'deposit' || paymentType === 'withdrawal') {
          const member = await profileByUserId(context, payment.user_id);
          paymentMember = member;
          const currentBalance = parseMoney(member?.balance);
          if (paymentType === 'withdrawal' && currentBalance < amount) {
            return jsonError('Member balance is too low to approve this withdrawal.', 400);
          }
          const nextBalance = paymentType === 'deposit' ? currentBalance + amount : currentBalance - amount;

          const { error: profileError } = await context.supabase
            .from('profiles')
            .update({
              balance: nextBalance,
              updated_at: reviewedAt,
            })
            .eq('user_id', payment.user_id);

          if (profileError) throw profileError;

          const { error: transactionError } = await context.supabase.from('transactions').insert({
            user_id: payment.user_id,
            amount,
            type: paymentType,
            status: 'success',
            reference: payment.transaction_reference || reference(paymentType === 'deposit' ? 'DEP' : 'WDR'),
            description:
              paymentType === 'deposit'
                ? 'Deposit payment approved by admin'
                : 'Withdrawal payment approved by admin',
            created_at: reviewedAt,
          });

          if (transactionError) throw transactionError;
        }
      }

      const { data: reviewedPayment, error: paymentError } = await context.supabase
        .from('payment_submissions')
        .update({
          status,
          reviewed_at: reviewedAt,
          reviewed_by: context.adminId,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (paymentError) throw paymentError;

      if (status === 'approved') {
        if (!paymentMember) {
          paymentMember = await profileByUserId(context, reviewedPayment.user_id);
        }

        await notifyUserSafely(
          context,
          reviewedPayment.user_id,
          'Payment Confirmed',
          `Your payment of ${formatNaira(reviewedPayment.amount)} has been confirmed and your account has been updated.`,
          'success'
        );
        await resendEmailSafely({
          to: reviewedPayment.email || paymentMember?.email,
          subject: emailSubjects.paymentConfirmed,
          html: paymentConfirmedEmail({
            memberName: reviewedPayment.full_name || paymentMember?.full_name,
            amount: reviewedPayment.amount,
            paymentType: reviewedPayment.payment_type || 'payment',
          }),
        });
      } else if (status === 'rejected') {
        if (!paymentMember) {
          paymentMember = await profileByUserId(context, reviewedPayment.user_id);
        }

        await notifyUserSafely(
          context,
          reviewedPayment.user_id,
          'Payment Update',
          'Your payment submission requires attention. Please contact smartsavecooperative@gmail.com',
          'info'
        );
        await customEmailSafely({
          to: reviewedPayment.email || paymentMember?.email,
          subject: 'Payment submission update',
          html: `
            <div style="font-family:Arial,sans-serif;background:#0A0A0A;color:#f8fafc;padding:28px;">
              <div style="max-width:640px;margin:0 auto;border:1px solid rgba(212,175,55,.25);border-radius:14px;background:#111;padding:24px;">
                <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#D4AF37;font-weight:800;">Smart Save Cooperative</p>
                <h1 style="color:#fff;">Payment Update</h1>
                <p style="color:#d4d4d8;line-height:1.7;">Your payment submission requires attention. Please contact smartsavecooperative@gmail.com for support.</p>
              </div>
            </div>
          `,
        });
      }

      await adminActivitySafely(context, {
        actionType: status === 'approved' ? 'payment_approved' : 'payment_rejected',
        targetUserId: reviewedPayment.user_id,
        targetUserEmail: reviewedPayment.email || paymentMember?.email,
        entityType: 'payment',
        entityId: reviewedPayment.id,
        details: {
          amount: reviewedPayment.amount,
          type: reviewedPayment.payment_type,
          status,
          reason,
        },
      });
      await logAdminAction(context, `payment.${status}`, reviewedPayment.user_id, { id, paymentType: reviewedPayment.payment_type, reason });
      return NextResponse.json({ success: true, data: reviewedPayment });
    }

    if (action === 'grantAdmin' || action === 'suspendMember' || action === 'removeAdmin') {
      const userId = asString(body.userId);
      if (!userId) return jsonError('Member is required.');

      const update =
        action === 'suspendMember'
          ? { is_active: false, updated_at: new Date().toISOString() }
          : { is_admin: action === 'grantAdmin', updated_at: new Date().toISOString() };

      const { data, error } = await context.supabase.from('profiles').update(update).eq('user_id', userId).select('*').single();
      if (error) throw error;

      await logAdminAction(context, action, userId);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'addAdmin') {
      const email = asString(body.email).toLowerCase();
      if (!email) return jsonError('Email is required.');

      const { data, error } = await context.supabase
        .from('profiles')
        .update({ is_admin: true, updated_at: new Date().toISOString() })
        .eq('email', email)
        .select('*')
        .single();

      if (error) throw error;
      await logAdminAction(context, 'addAdmin', data.user_id, { email });
      return NextResponse.json({ success: true, data });
    }

    if (action === 'addAdminNote') {
      const userId = asString(body.userId);
      const note = asString(body.note);
      if (!userId || !note) return jsonError('Member and note are required.');

      const { data, error } = await context.supabase
        .from('profiles')
        .update({ notes: note, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;
      await logAdminAction(context, 'member.note', userId, { note });
      return NextResponse.json({ success: true, data });
    }

    if (action === 'loanStatus' || action === 'investmentStatus') {
      const id = asString(body.id);
      const status = asString(body.status);
      const reason = asString(body.reason);
      if (!id || !status) return jsonError('Application and status are required.');
      if (status === 'rejected' && !reason) return jsonError('Rejection reason is required.');
      if (action === 'investmentStatus' && status === 'approved') {
        if (!asString(body.startDate) || !asString(body.maturityDate)) {
          return jsonError('Start date and maturity date are required to approve an investment.');
        }
        if (parseMoney(body.agreedReturnRate) <= 0 || parseMoney(body.totalReturnAmount) <= 0) {
          return jsonError('Agreed return rate and total return amount are required to approve an investment.');
        }
      }

      const data = await updateApplicationStatus(
        context,
        action === 'loanStatus' ? 'loan_applications' : 'investment_applications',
        id,
        status,
        reason,
        body
      );
      return NextResponse.json({ success: true, data });
    }

    if (action === 'addApplicationNote') {
      const table = asString(body.table);
      const id = asString(body.id);
      const note = asString(body.note);
      if (!['loan_applications', 'investment_applications'].includes(table) || !id || !note) {
        return jsonError('Application and note are required.');
      }

      const { data, error } = await context.supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      await logAdminAction(context, `${table}.note`, data.user_id, { id, note });
      return NextResponse.json({ success: true, data });
    }

    if (action === 'recordLoanPayment') {
      const loanId = asString(body.loanId);
      const userId = asString(body.userId);
      const amount = parseMoney(body.amount);
      if (!loanId || !userId || amount <= 0) return jsonError('Loan, member, and amount are required.');

      try {
        const { data: loan, error: loanError } = await context.supabase
          .from('loan_applications')
          .select('*')
          .eq('id', loanId)
          .single();
        if (loanError) throw loanError;

        const { data, error } = await context.supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount,
            type: 'loan_repayment',
            status: 'success',
            loan_id: loanId,
            reference: reference('LRP'),
            description: 'Manual loan repayment recorded by admin',
          })
          .select('*')
          .single();

        if (error) throw error;

        const { data: repayments, error: repaymentsError } = await context.supabase
          .from('transactions')
          .select('amount')
          .eq('loan_id', loanId)
          .eq('type', 'loan_repayment')
          .eq('status', 'success');
        if (repaymentsError) throw repaymentsError;

        const totalRepaid = (repayments || []).reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);
        const principal = parseMoney(loan.amount_approved || loan.amount_requested);
        const remaining = Math.max(0, principal - totalRepaid);

        await notifyUserSafely(
          context,
          userId,
          'Loan Repayment Recorded',
          `Your loan repayment of ${formatNaira(amount)} has been recorded. Remaining balance: ${formatNaira(remaining)}`,
          'loan'
        );
        await logAdminAction(context, 'loan.repayment', userId, { loanId, amount, remaining });
        return NextResponse.json({ success: true, data, remaining, totalRepaid });
      } catch (error) {
        throw error;
      }
    }

    if (action === 'createLoanProduct') {
      return jsonError('Custom loan plans are coming soon.', 503);
    }

    if (action === 'withdrawalStatus') {
      const id = asString(body.id);
      const status = asString(body.status);
      const reason = asString(body.reason);
      if (!id || !status) return jsonError('Withdrawal and status are required.');
      if (status === 'rejected' && !reason) return jsonError('Rejection reason is required.');

      const update: Record<string, unknown> = {
        status,
        reviewed_by: context.adminId,
        reviewed_at: new Date().toISOString(),
      };
      if (reason) update.rejection_reason = reason;
      if (status === 'transferred') update.transferred_at = new Date().toISOString();

      const { data: transaction, error } = await context.supabase
        .from('transactions')
        .update(update)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      const member = await profileByUserId(context, transaction.user_id);
      if (status === 'approved') {
        const nextBalance = Math.max(0, parseMoney(member?.balance) - parseMoney(transaction.amount));
        await context.supabase
          .from('profiles')
          .update({ balance: nextBalance, updated_at: new Date().toISOString() })
          .eq('user_id', transaction.user_id);
        await emailSafely({
          to: member?.email,
          template: 'withdrawalApproved',
          data: {
            name: member?.full_name,
            amount: formatNaira(transaction.amount),
            bank: transaction.bank_name,
            account: transaction.account_number,
          },
        });
      } else if (status === 'rejected') {
        await emailSafely({ to: member?.email, template: 'withdrawalRejected', data: { name: member?.full_name, reason } });
      } else if (status === 'transferred') {
        await emailSafely({ to: member?.email, template: 'withdrawalTransferred', data: { name: member?.full_name, amount: formatNaira(transaction.amount) } });
      }

      await logAdminAction(context, `withdrawal.${status}`, transaction.user_id, { id, reason });
      return NextResponse.json({ success: true, data: transaction });
    }

    if (action === 'manualTransaction') {
      const userId = asString(body.userId);
      const type = asString(body.type) || 'manual_adjustment';
      const amount = parseMoney(body.amount);
      if (!userId || amount <= 0) return jsonError('Member and amount are required.');

      const { data, error } = await context.supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount,
          type,
          status: 'approved',
          reference: reference('MAN'),
          description: asString(body.description) || 'Manual admin transaction',
        })
        .select('*')
        .single();

      if (error) throw error;
      await logAdminAction(context, 'transaction.manual', userId, { type, amount });
      return NextResponse.json({ success: true, data });
    }

    if (action === 'createAnnouncement') {
      const title = asString(body.title);
      const announcementBody = asString(body.body);
      const recipientType = asString(body.recipientType) === 'specific' ? 'specific' : 'all';
      const requestedRecipientIds = asStringArray(body.recipientUserIds);
      if (!title || !announcementBody) return jsonError('Title and body are required.');
      if (recipientType === 'specific' && requestedRecipientIds.length === 0) {
        return jsonError('Select at least one member for a specific announcement.');
      }

      let recipientQuery = context.supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('is_admin', false)
        .eq('is_active', true);

      if (recipientType === 'specific') {
        recipientQuery = recipientQuery.in('user_id', requestedRecipientIds);
      }

      const { data: recipients, error: recipientError } = await recipientQuery;
      if (recipientError) throw recipientError;

      const recipientRows = recipients || [];
      const sentAt = new Date().toISOString();
      const recipientUserIds = recipientType === 'specific' ? recipientRows.map((recipient) => recipient.user_id) : [];

      const { data, error } = await context.supabase
        .from('announcements')
        .insert({
          title,
          body: announcementBody,
          type: asString(body.type) || 'info',
          recipient_type: recipientType,
          recipient_user_ids: recipientUserIds,
          created_by: context.adminId,
          sent_at: sentAt,
          sent_count: 0,
        })
        .select('*')
        .single();

      if (error) {
        return jsonError(error.message || 'Unable to create announcement.', 500);
      }

      if (recipientRows.length > 0) {
        const { error: notificationError } = await context.supabase.from('notifications').insert(
          recipientRows.map((recipient) => ({
            user_id: recipient.user_id,
            title,
            message: announcementBody,
            type: 'info',
            is_read: false,
          }))
        );

        if (notificationError) throw notificationError;

        const origin = new URL(request.url).origin;
        await Promise.all(
          recipientRows.map(async (recipient) => {
            try {
              if (!recipient.email) return;
              const response = await fetch(`${origin}/api/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: recipient.email,
                  type: 'announcement',
                  memberName: recipient.full_name || 'Smart Save member',
                  details: {
                    title,
                    body: announcementBody,
                  },
                }),
              });

              if (!response.ok) {
                await response.json().catch(() => null);
              }
            } catch {
              // Announcement emails are best-effort.
            }
          })
        );
      }

      const { data: updatedAnnouncement, error: updateError } = await context.supabase
        .from('announcements')
        .update({ sent_count: recipientRows.length })
        .eq('id', data.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      await logAdminAction(context, 'announcement.create', null, {
        id: updatedAnnouncement.id,
        title,
        recipientType,
        sentCount: recipientRows.length,
      });
      return NextResponse.json({ success: true, data: updatedAnnouncement });
    }

    if (action === 'deleteAnnouncement') {
      const id = asString(body.id);
      if (!id) return jsonError('Announcement is required.');

      const { error } = await context.supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await logAdminAction(context, 'announcement.delete', null, { id });
      return NextResponse.json({ success: true });
    }

    if (action === 'saveSettings') {
      return jsonError('Cooperative settings are coming soon.', 503);
    }

    return jsonError('Unknown admin action.', 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to complete admin action.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
