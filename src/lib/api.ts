import { ApiResponse } from "./types";

const API_BASE = "/api";

async function request<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data: ApiResponse<T> = await res.json();
  if (!data.success) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

// ─── Health ───
export const healthCheck = () => request("/health");

// ─── Scrap Rates ───
export const getScrapRates = () => request<any[]>("/scrap-rates");
export const createScrapRate = (body: any) =>
  request("/scrap-rates", { method: "POST", body: JSON.stringify(body) });
export const updateScrapRate = (id: string, body: any) =>
  request(`/scrap-rates/${id}`, { method: "PUT", body: JSON.stringify(body) });

// ─── Auth ───
export const registerUser = (body: {
  name: string;
  phone: string;
  role: string;
  pincode?: string;
  address?: string;
}) => request("/auth/register", { method: "POST", body: JSON.stringify(body) });

export const loginUser = (phone: string) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ phone }) });

// ─── Users ───
export const getCollectors = (pincode?: string) =>
  request<any[]>(`/users/collectors${pincode ? `?pincode=${pincode}` : ""}`);

// ─── Orders ───
export const createOrder = (body: any) =>
  request("/orders", { method: "POST", body: JSON.stringify(body) });

export const getOrders = (filters?: Record<string, string>) => {
  const params = new URLSearchParams(filters || {}).toString();
  return request<any[]>(`/orders${params ? `?${params}` : ""}`);
};

export const getOrderById = (id: string) => request<any>(`/orders/${id}`);

export const assignOrder = (id: string, collectorId: string) =>
  request(`/orders/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ collectorId }),
  });

export const updateOrderStatus = (
  id: string,
  body: { status: string; actualWeight?: number; finalAmount?: number }
) =>
  request(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// ─── Invite-Only Auth ───

/** Helper: create request with JWT Bearer token */
function authRequest<T = any>(
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

/** SUPER_ADMIN: Generate an 8-char invite code */
export const generateInviteCode = (
  token: string,
  roleToGrant: string = "ADMIN"
) =>
  authRequest("/auth/generate-code", token, {
    method: "POST",
    body: JSON.stringify({ roleToGrant }),
  });

/** Public: Verify an activation code */
export const verifyInviteCode = (code: string) =>
  request("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

/** Public: Register admin with activation code */
export const registerAdmin = (body: {
  name: string;
  phone: string;
  password: string;
  code: string;
}) =>
  request("/auth/register-admin", {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Admin/SUPER_ADMIN login with phone + password */
export const adminLogin = (phone: string, password: string) =>
  request("/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });

/** Get current user profile (requires JWT) */
export const getAuthMe = (token: string) =>
  authRequest("/auth/me", token);

