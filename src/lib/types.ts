// ─── Shared TypeScript types matching the backend Prisma models ───

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "CUSTOMER" | "COLLECTOR" | "ADMIN" | "SUPER_ADMIN";
  address?: string | null;
  pincode?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ScrapCategory {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  unit: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PickupOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  collectorId?: string | null;
  status: OrderStatus;
  scheduledDate: string;
  timeSlot: string;
  estimatedWeight: number;
  actualWeight?: number | null;
  estimatedAmount: number;
  finalAmount?: number | null;
  pickupAddress: string;
  pincode: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Partial<User>;
  collector?: Partial<User> | null;
  notificationLogs?: NotificationLog[];
  itemBreakdown?: string[];
}

export type OrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface NotificationLog {
  id: string;
  orderId: string;
  recipientPhone: string;
  recipientRole: string;
  channel: string;
  messageContent: string;
  status: string;
  sentAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

// ─── Form types ───

export interface BookingFormData {
  name: string;
  phone: string;
  address: string;
  pincode: string;
  scheduledDate: string;
  timeSlot: string;
  notes: string;
  items: { scrapCategoryId: string; estimatedWeight: number }[];
}
