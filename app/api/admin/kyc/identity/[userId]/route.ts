import { NextResponse } from 'next/server';

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: 'Identity verification review is coming soon.',
    },
    { status: 503 }
  );
}
