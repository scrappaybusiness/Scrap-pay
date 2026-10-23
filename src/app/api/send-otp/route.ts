import { NextResponse } from 'next/server';
import otpStore from '@/lib/otpStore';

/**
 * POST /api/send-otp
 * Receives: { mobile: "9876543210" }
 * Dispatches 6-digit OTP using Fast2SMS Gateway
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json(
        { success: false, error: 'Mobile number is required.' },
        { status: 400 }
      );
    }

    const cleanDigits = mobile.replace(/\D/g, '');
    const tenDigits = cleanDigits.slice(-10);

    if (!/^[6-9]\d{9}$/.test(tenDigits)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in global OTP cache (valid for 5 minutes)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(tenDigits, {
      otp: generatedOtp,
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString()
    });

    console.log(`[Fast2SMS OTP Dispatcher] Target: +91${tenDigits} | Generated OTP: ${generatedOtp}`);

    // Fast2SMS Gateway Call
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.warn('[Fast2SMS Warning] FAST2SMS_API_KEY is not defined in environment variables.');
    }

    let gatewaySuccess = false;
    let gatewayMessage = '';

    try {
      const fast2smsPayload = {
        route: 'otp',
        variables_values: generatedOtp,
        numbers: tenDigits
      };

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fast2smsPayload)
      });

      const fast2smsResult = await response.json();
      console.log('[Fast2SMS API Response]', fast2smsResult);

      if (response.ok && (fast2smsResult.return === true || fast2smsResult.status_code === 200)) {
        gatewaySuccess = true;
        gatewayMessage = (Array.isArray(fast2smsResult.message) ? fast2smsResult.message.join(' ') : fast2smsResult.message) || 'SMS sent successfully.';
      } else {
        gatewaySuccess = false;
        gatewayMessage = fast2smsResult.message || 'SMS Gateway responded with an error.';
      }
    } catch (gatewayErr: any) {
      console.error('[Fast2SMS Network Error]:', gatewayErr.message);
      gatewaySuccess = false;
      gatewayMessage = `Failed to connect to Fast2SMS: ${gatewayErr.message}`;
    }

    if (gatewaySuccess) {
      return NextResponse.json(
        {
          success: true,
          gateway: 'fast2sms',
          mobile: `+91${tenDigits}`,
          message: `OTP sent successfully to +91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)} via SMS.`
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        gateway: 'fast2sms_notice',
        mobile: `+91${tenDigits}`,
        message: `OTP generated for +91 ${tenDigits}.`,
        fast2sms_notice: gatewayMessage,
        dev_otp: generatedOtp
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[Send OTP Route Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error while generating OTP'
      },
      { status: 500 }
    );
  }
}
