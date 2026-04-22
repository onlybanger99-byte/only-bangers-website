import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'The temporary admin unlock flow has been removed. Use the standard sign-in flow.',
    },
    { status: 410 }
  )
}
