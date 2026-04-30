import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'The temporary admin test endpoint has been removed from production routes.',
    },
    { status: 410 }
  )
}
