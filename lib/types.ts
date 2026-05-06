// Shared types for Linger.

export type ItemStatus =
  | "active"
  | "pending_decision"
  | "archived"
  | "bought"
  | "deleted";

export type ItemCategory =
  | "clothes"
  | "beauty"
  | "electronics"
  | "home"
  | "other";

export type SourceType = "url" | "photo";

export type Item = {
  id: string;
  user_id: string;

  source_type: SourceType;
  source_url: string | null;
  store_name: string | null;
  category: ItemCategory;

  name: string;
  image_url: string | null;
  reason: string | null;

  price_added: number;
  price_current: number | null;
  price_currency: string;
  is_in_stock: boolean | null;
  last_price_check_at: string | null;

  cooldown_started_at: string;
  cooldown_ends_at: string;
  cooldown_extended_count: number;

  status: ItemStatus;
  decided_at: string | null;
  override_used: boolean;

  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  default_cooldown_days_online: number;
  default_cooldown_days_inperson: number;
  bored_checkin_enabled: boolean;
  email_notifications_enabled: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ExtractedItem = {
  success: boolean;
  name: string | null;
  image_url: string | null;
  price: number | null;
  store_name: string | null;
  currency: string;
  error?: string;
};

export const CATEGORIES: ItemCategory[] = [
  "clothes",
  "beauty",
  "electronics",
  "home",
  "other",
];
