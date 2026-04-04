import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;

    // Phase 4: Temporary admin gate
    // In Phase 5, this will be replaced with proper RBAC checks
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      console.error('ADMIN_SECRET not configured in environment');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (!secret || secret !== adminSecret) {
      return NextResponse.json(
        { error: 'Invalid admin secret' },
        { status: 401 }
      );
    }

    // Secret is valid - set admin cookie
    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: 'ob_admin',
      value: secret,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Admin unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 400 }
    );
  }
}
