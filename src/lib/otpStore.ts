/**
 * Global In-Memory Store for OTP Verification
 * Uses globalThis so the store persists across Next.js API route invocations.
 */
if (!(globalThis as any)._scrapPayOtpStore) {
  (globalThis as any)._scrapPayOtpStore = new Map<string, {
    otp: string;
    expiresAt: number;
    attempts: number;
    createdAt: string;
  }>();
}

const otpStore: Map<string, {
  otp: string;
  expiresAt: number;
  attempts: number;
  createdAt: string;
}> = (globalThis as any)._scrapPayOtpStore;

export default otpStore;
