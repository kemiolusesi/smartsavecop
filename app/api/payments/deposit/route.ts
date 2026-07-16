import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Online card payments are not enabled. Please use manual bank transfer and submit your deposit proof.',
    },
    { status: 400 }
  );
}
