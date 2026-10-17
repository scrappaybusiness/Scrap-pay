/**
 * Global In-Memory Store for OTP Verification
 * Uses globalThis so the store persists across Next.js API route invocations.
 */
if (!globalThis._scrapPayOtpStore) {
  globalThis._scrapPayOtpStore = new Map();
}

const otpStore = globalThis._scrapPayOtpStore;

export default otpStore;
