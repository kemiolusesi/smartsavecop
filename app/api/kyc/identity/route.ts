import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Identity verification is coming soon.',
    },
    { status: 503 }
  );
}
