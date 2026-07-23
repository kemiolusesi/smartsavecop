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

function investmentProductPatchPayload(body: Record<string, unknown>) {
  const productType = asString(body.product_type) === 'savings' ? 'savings' : asString(body.product_type) === 'fixed' ? 'fixed' : '';
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (hasField(body, 'name')) payload.name = asString(body.name);
  if (hasField(body, 'description')) payload.description = asString(body.description) || null;
  if (hasField(body, 'product_type')) payload.product_type = productType || 'fixed';
  if (hasField(body, 'min_amount')) payload.min_amount = asNumber(body.min_amount);
  if (hasField(body, 'max_amount')) {
    payload.max_amount = body.max_amount === null || body.max_amount === undefined || body.max_amount === '' ? null : asNumber(body.max_amount);
  }
  if (hasField(body, 'monthly_rate')) {
    payload.monthly_rate = body.monthly_rate === null || body.monthly_rate === undefined || body.monthly_rate === '' ? null : asNumber(body.monthly_rate);
  }
  if (hasField(body, 'total_return_rate')) {
    payload.total_return_rate =
      body.total_return_rate === null || body.total_return_rate === undefined || body.total_return_rate === ''
        ? null
        : asNumber(body.total_return_rate);
  }
  if (hasField(body, 'tenure_months')) payload.tenure_months = asNumber(body.tenure_months);
  if (hasField(body, 'payout_interval_months')) payload.payout_interval_months = asNumber(body.payout_interval_months);
  if (hasField(body, 'is_active')) payload.is_active = typeof body.is_active === 'boolean' ? body.is_active : true;
  if (hasField(body, 'sort_order')) payload.sort_order = asNumber(body.sort_order);

  return payload;
}

export async function GET() {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  const { data, error } = await context.supabase
    .from('investment_products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return jsonError(error.message || 'Unable to load investment plans.', 500);
  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: Request) {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  const body = await request.json();
  const payload = investmentProductPatchPayload(body);
  const productType = asString(payload.product_type) || '';
  if (hasField(payload, 'name') && !payload.name) return jsonError('Plan name is required.');
  if (hasField(payload, 'min_amount') && Number(payload.min_amount) <= 0) return jsonError('Minimum amount is required.');
  if (productType === 'fixed' && hasField(payload, 'monthly_rate') && Number(payload.monthly_rate || 0) <= 0) return jsonError('Monthly rate is required.');
  if (productType === 'savings' && hasField(payload, 'total_return_rate') && Number(payload.total_return_rate || 0) <= 0) return jsonError('Total return rate is required.');
  if (hasField(payload, 'tenure_months') && Number(payload.tenure_months) <= 0) return jsonError('Tenure is required.');
  if (hasField(payload, 'payout_interval_months') && Number(payload.payout_interval_months) <= 0) return jsonError('Payout interval is required.');

  const { data, error } = await context.supabase
    .from('investment_products')
    .insert(payload)
    .select('*')
    .single();

  if (error) return jsonError(error.message || 'Unable to create investment plan.', 500);
  await notifyApprovedMembers(context.supabase, {
    title: 'New Investment Plan Available',
    message: `A new investment plan "${data.name}" has been added. View it on your Investments page.`,
  });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request) {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  const body = await request.json();
  const id = asString(body.id);
  if (!id) return jsonError('Plan is required.');

  const payload = investmentProductPatchPayload(body);
  const productType = asString(payload.product_type) || '';
  if (hasField(payload, 'name') && !payload.name) return jsonError('Plan name is required.');
  if (hasField(payload, 'min_amount') && Number(payload.min_amount) <= 0) return jsonError('Minimum amount is required.');
  if (productType === 'fixed' && hasField(payload, 'monthly_rate') && Number(payload.monthly_rate || 0) <= 0) return jsonError('Monthly rate is required.');
  if (productType === 'savings' && hasField(payload, 'total_return_rate') && Number(payload.total_return_rate || 0) <= 0) return jsonError('Total return rate is required.');
  if (hasField(payload, 'tenure_months') && Number(payload.tenure_months) <= 0) return jsonError('Tenure is required.');
  if (hasField(payload, 'payout_interval_months') && Number(payload.payout_interval_months) <= 0) return jsonError('Payout interval is required.');

  const { data, error } = await context.supabase
    .from('investment_products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return jsonError(error.message || 'Unable to update investment plan.', 500);
  if (hasField(body, 'is_active')) {
    await notifyApprovedMembers(context.supabase, {
      title: data.is_active ? 'Investment Plan Now Available' : 'Investment Plan Discontinued',
      message: data.is_active
        ? `The investment plan "${data.name}" is now available. Visit your Investments page to apply.`
        : `The investment plan "${data.name}" is no longer accepting new applications.`,
    });
  }
  return NextResponse.json({ success: true, data });
}
