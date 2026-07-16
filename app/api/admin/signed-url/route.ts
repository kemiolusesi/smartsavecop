import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createPrivateBucketSignedUrl } from '@/lib/storage/privateBuckets';

const ALLOWED_BUCKETS = new Set(['kyc-documents', 'payment-proofs']);

export async function POST(request: Request) {
  const context = await requireAdmin();
  if (context instanceof NextResponse) return context;

  try {
    const body = await request.json();
    const bucket = typeof body.bucket === 'string' ? body.bucket : '';
    const path = typeof body.path === 'string' ? body.path : '';

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ success: false, error: 'Storage bucket is not allowed.' }, { status: 400 });
    }

    const signedUrl = await createPrivateBucketSignedUrl(context.supabase, bucket, path);
    if (!signedUrl) {
      return NextResponse.json({ success: false, error: 'Unable to create signed URL.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create signed URL.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
