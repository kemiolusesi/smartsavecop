import { NextResponse } from 'next/server';
import { jsonError, requireAdmin } from '@/lib/admin-auth';
import { notifyApprovedMembers } from '@/lib/admin-product-notifications';

export const dynamic = 'force-dynamic';

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasField(body: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function loanProductPatchPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (hasField(body, 'name')) payload.name = asString(body.name);
  if (hasField(body, 'description')) payload.description = asString(body.description) || null;
  if (hasField(body, 'min_amount')) payload.min_amount = asNumber(body.min_amount);
  if (hasField(body, 'max_amount')) {
    payload.max_amount = body.max_amount === null || body.max_amount === undefined || body.max_amount === '' ? null : asNumber(body.max_amount);
  }
  if (hasField(body, 'monthly_interest_rate')) payload.monthly_interest_rate = asNumber(body.monthly_interest_rate);
  if (hasField(body, 'tenure_months')) payload.tenure_months = asNumber(body.tenure_months);
  if (hasField(body, 'requirements')) payload.requirements = asString(body.requirements) || null;
  if (hasField(body, 'is_active')) payload.is_active = typeof body.is_active === 'boolean' ? body.is_active : true;
  if (hasField(body, 'sort_order')) payload.sort_order = asNumber(body.sort_order);

  return payload;
}

export async function GET() {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  const { data, error } = await context.supabase
    .from('loan_products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return jsonError(error.message || 'Unable to load loan plans.', 500);
  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: Request) {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  const body = await request.json();
  const payload = loanProductPatchPayload(body);
  if (hasField(payload, 'name') && !payload.name) return jsonError('Plan name is required.');
  if (hasField(payload, 'min_amount') && Number(payload.min_amount) <= 0) return jsonError('Minimum amount is required.');
  if (hasField(payload, 'monthly_interest_rate') && Number(payload.monthly_interest_rate) <= 0) return jsonError('Monthly interest rate is required.');
  if (hasField(payload, 'tenure_months') && Number(payload.tenure_months) <= 0) return jsonError('Tenure is required.');

  const { data, error } = await context.supabase
    .from('loan_products')
    .insert(payload)
    .select('*')
    .single();

  if (error) return jsonError(error.message || 'Unable to create loan plan.', 500);
  await notifyApprovedMembers(context.supabase, {
    title: 'New Loan Plan Available',
    message: `A new loan plan "${data.name}" has been added. Check it out in your dashboard under Loans.`,
  });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request) {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  const body = await request.json();
  const id = asString(body.id);
  if (!id) return jsonError('Plan is required.');

  const payload = loanProductPatchPayload(body);
  if (hasField(payload, 'name') && !payload.name) return jsonError('Plan name is required.');
  if (hasField(payload, 'min_amount') && Number(payload.min_amount) <= 0) return jsonError('Minimum amount is required.');
  if (hasField(payload, 'monthly_interest_rate') && Number(payload.monthly_interest_rate) <= 0) return jsonError('Monthly interest rate is required.');
  if (hasField(payload, 'tenure_months') && Number(payload.tenure_months) <= 0) return jsonError('Tenure is required.');

  const { data, error } = await context.supabase
    .from('loan_products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return jsonError(error.message || 'Unable to update loan plan.', 500);
  if (hasField(body, 'is_active')) {
    await notifyApprovedMembers(context.supabase, {
      title: data.is_active ? 'Loan Plan Now Available' : 'Loan Plan Discontinued',
      message: data.is_active
        ? `The loan plan "${data.name}" is now available. You can apply from your dashboard.`
        : `The loan plan "${data.name}" is no longer available for new applications.`,
    });
  }
  return NextResponse.json({ success: true, data });
}
