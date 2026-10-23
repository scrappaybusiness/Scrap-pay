import { NextResponse } from 'next/server';
import otpStore from '@/lib/otpStore';

/**
 * POST /api/verify-otp
 * Receives: { mobile: "9876543210", otp: "123456" }
 * Verifies 6-digit code against actual generated OTP
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile, otp } = body;

    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, error: 'Mobile number and OTP are required.' },
        { status: 400 }
      );
    }

    const cleanDigits = mobile.replace(/\D/g, '');
    const tenDigits = cleanDigits.slice(-10);
    const cleanOtp = otp.toString().trim();

    const record = otpStore.get(tenDigits);

    if (!record) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No active OTP request found for this number. Please click "Resend OTP".' 
        },
        { status: 400 }
      );
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      otpStore.delete(tenDigits);
      return NextResponse.json(
        { 
          success: false, 
          error: 'This OTP has expired. Please request a new OTP.' 
        },
        { status: 400 }
      );
    }

    // Rate-limiting brute-force attempts
    if (record.attempts >= 5) {
      otpStore.delete(tenDigits);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many incorrect attempts. Please request a new OTP.' 
        },
        { status: 429 }
      );
    }

    // Verify OTP match
    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      const remainingAttempts = 5 - record.attempts;
      return NextResponse.json(
        { 
          success: false, 
          error: `Incorrect OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Maximum attempts exceeded.'}` 
        },
        { status: 400 }
      );
    }

    // Clear OTP once verified successfully
    console.log(`[OTP Verified] Successfully verified OTP for +91${tenDigits}`);
    otpStore.delete(tenDigits);

    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully.',
        mobile: `+91${tenDigits}`
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[Verify OTP Route Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error while verifying OTP.'
      },
      { status: 500 }
    );
  }
}
