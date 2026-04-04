import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (use service role key for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Zoho sends bounce notifications as JSON. Example structure:
    // { "email": "bounced@example.com", "reason": "550 5.1.1 User unknown" }
    const body = await req.json();
    const bouncedEmail = body.email;
    const reason = body.reason || 'hard_bounce';

    if (!bouncedEmail) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    }

    // Update the subscriber record: mark inactive and record reason
    const { error } = await supabase
      .from('email_subscribers')
      .update({ is_active: false, bounce_reason: reason, updated_at: new Date().toISOString() })
      .eq('email', bouncedEmail);

    if (error) {
      console.error('Failed to update bounce record:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Also log to console for debugging (optional)
    console.log(`Marked ${bouncedEmail} as inactive due to bounce: ${reason}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Bounce handler error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}