/**
 * Client-side auth utilities for Bottel Pay.
 * Manages JWT token in both localStorage and a cookie (for middleware).
 */

const TOKEN_KEY = "bottelpay_token";
const USER_KEY = "bottelpay_user";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: "SUPER_ADMIN" | "ADMIN" | "COLLECTOR" | "CUSTOMER";
  createdAt?: string;
}

/** Save auth data after login/register */
export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Also set a cookie so Next.js middleware can read it
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

/** Get stored JWT token */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Get stored user profile */
export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clear all auth data (logout) */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Clear the cookie
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

/** Check if user is authenticated */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/** Check if user has one of the specified roles */
export function hasRole(...roles: string[]): boolean {
  const user = getUser();
  return !!user && roles.includes(user.role);
}
