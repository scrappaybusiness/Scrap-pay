import { NextResponse } from 'next/server';
import otpStore from '@/lib/otpStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mobile = String(body.mobile || '');
    const tenDigits = mobile.replace(/\D/g, '').slice(-10);

    if (!/^[6-9]\d{9}$/.test(tenDigits)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      console.error('FAST2SMS_API_KEY is missing from the server environment.');
      return NextResponse.json(
        { success: false, error: 'SMS service is not configured.' },
        { status: 500 }
      );
    }

    const generatedOtp = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    let response: Response;
    let result: any;

    try {
      response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: generatedOtp,
          numbers: tenDigits
        }),
        cache: 'no-store'
      });

      result = await response.json();
    } catch (error) {
      console.error('Fast2SMS request failed:', error);
      return NextResponse.json(
        { success: false, error: 'Could not contact the SMS provider.' },
        { status: 502 }
      );
    }

    // Check the provider's actual response before saving the OTP.
    if (
      !response.ok ||
      !(result.return === true || result.status_code === 200)
    ) {
      console.error('Fast2SMS rejected the request:', result);

      return NextResponse.json(
        {
          success: false,
          error: 'Fast2SMS rejected the request. Check the server logs and account settings.'
        },
        { status: 502 }
      );
    }

    // Save the OTP only after the provider accepts the request.
    otpStore.set(tenDigits, {
      otp: generatedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      createdAt: new Date().toISOString()
    });

    // Never return or log the OTP itself.
    return NextResponse.json({
      success: true,
      gateway: 'fast2sms',
      message: 'The SMS provider accepted the OTP request.'
    });
  } catch (error) {
    console.error('Send OTP route error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error while sending OTP.' },
      { status: 500 }
    );
  }
}