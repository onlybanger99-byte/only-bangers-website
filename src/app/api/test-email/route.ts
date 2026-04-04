import { NextResponse } from 'next/server';
import { transporter, buildEmail } from '@/lib/email';

export async function GET() {
  // Subject: under 50 characters, no spam words
  const subject = 'Only Bangers – Test Email';

  // HTML email – high text ratio, working image (placeholder until your site is live)
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Only Bangers Test</title>
    </head>
    <body style="margin:0; padding:0; background-color:#0A0A0A; font-family: Arial, sans-serif;">
      <div style="max-width:600px; margin:0 auto; background-color:#0A0A0A; color:#FFFFFF; padding:20px;">
        <!-- Logo – uses a working placeholder. Replace with your real logo URL later -->
        <div style="text-align:center; margin-bottom:20px;">
          <img src="https://via.placeholder.com/200x60/C9A84C/000000?text=Only+Bangers" 
               alt="Only Bangers" style="max-width:100%; height:auto;">
        </div>
        
        <h1 style="color:#C9A84C; font-size:28px; margin-top:0;">South Africa's sharpest barbering brand</h1>
        
        <p style="font-size:16px; line-height:1.5;">We're building a platform that connects South African men with the best barbers in the country. Every cut, every fade, every beard – we've got you covered.</p>
        
        <p style="font-size:16px; line-height:1.5;">This is a test email to verify our email system. If you're seeing this, everything is working correctly.</p>
        
        <p style="font-size:16px; line-height:1.5;">Over the coming weeks, you'll receive updates, special offers, and barber tips delivered straight to your inbox.</p>
        
        <p style="font-size:16px; line-height:1.5;">Stay sharp.</p>
        
        <hr style="border:0; height:1px; background-color:#333; margin:20px 0;">
        
        <p style="font-size:12px; color:#999;">
          <a href="https://onlybangers.co.za/unsubscribe" style="color:#C9A84C;">Unsubscribe</a> from future emails.
        </p>
      </div>
    </body>
    </html>
  `;

  // Use buildEmail to generate the full email object with headers and plain text
  const mailOptions = buildEmail(
    'test-7htf74hf7@srv1.mail-tester.com',   // <-- replace with the mail-tester address you get
    subject,
    html,
    'support@onlybangers.co.za',      // reply-to
    'support@onlybangers.co.za'       // unsubscribe email address
  );

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ 
      success: true, 
      message: 'Email sent. Check your mail-tester dashboard for the score.' 
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}