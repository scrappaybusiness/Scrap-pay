/**
 * Odoo JSON-RPC API Client for Scrap Pay
 * Connects Next.js to Odoo 16+ via JSON-RPC protocol.
 */

export interface OdooProduct {
  id: number;
  name: string;
  list_price: number; // Sales Price
  standard_price: number; // Cost Price (what we pay users)
  image_1920: string | false; // Base64 encoded image or false
  categ_id?: [number, string] | false;
  uom_id?: [number, string] | false;
}

export interface OdooAuthConfig {
  url?: string;
  db?: string;
  username?: string;
  password?: string;
}

/**
 * Resolves, cleans, and sanitizes Odoo credentials at runtime.
 * Prevents issues where environment variables are passed as literal variable names (e.g. "ODOO_DB").
 */
export function getOdooConfig(overrideConfig: OdooAuthConfig = {}) {
  const sanitize = (val?: string | null): string => {
    if (!val) return "";
    return val.trim().replace(/^["']|["']$/g, "");
  };

  let url = sanitize(overrideConfig.url || process.env.ODOO_URL);
  let db = sanitize(overrideConfig.db || process.env.ODOO_DB);
  let username = sanitize(overrideConfig.username || process.env.ODOO_USERNAME);
  let password = sanitize(overrideConfig.password || process.env.ODOO_PASSWORD);

  // If db was mistakenly configured as literal "ODOO_DB" or "$ODOO_DB", fall back to default
  if (!db || db.toLowerCase() === "odoo_db" || db === "$ODOO_DB") {
    db = "scrappay_db";
  }

  // If url was mistakenly configured as literal "ODOO_URL" or "$ODOO_URL"
  if (!url || url.toLowerCase() === "odoo_url" || url === "$ODOO_URL") {
    url = "http://localhost:8069";
  }

  // If username was mistakenly configured as literal "ODOO_USERNAME"
  if (!username || username.toLowerCase() === "odoo_username" || username === "$ODOO_USERNAME") {
    username = "scrappay.business@gmail.com";
  }

  // If password was mistakenly configured as literal "ODOO_PASSWORD"
  if (!password || password.toLowerCase() === "odoo_password" || password === "$ODOO_PASSWORD") {
    password = "Scrappayofficial@123";
  }

  return { url, db, username, password };
}

/**
 * Generic helper to make JSON-RPC calls to Odoo
 */
export async function callOdooJsonRpc<T = any>(
  service: "common" | "object",
  method: string,
  args: any[],
  config: OdooAuthConfig = {}
): Promise<T> {
  const { url } = getOdooConfig(config);
  const endpoint = `${url.replace(/\/+$/, "")}/jsonrpc`;

  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service,
      method,
      args,
    },
    id: Math.floor(Math.random() * 1000000),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Odoo server HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    const errorMsg = data.error.data?.message || data.error.message || "Unknown Odoo JSON-RPC error";
    throw new Error(`Odoo Error: ${errorMsg}`);
  }

  return data.result as T;
}

/**
 * Authenticates with Odoo using common service login
 * Returns UID (number) if successful, throws or returns null if failed
 */
export async function authenticateOdoo(config: OdooAuthConfig = {}): Promise<number> {
  const { db, username, password, url } = getOdooConfig(config);

  console.log(`[Odoo Client] Authenticating to ${url} on database "${db}" as "${username}"`);

  const uid = await callOdooJsonRpc<number | false>(
    "common",
    "login",
    [db, username, password],
    config
  );

  if (!uid || typeof uid !== "number") {
    throw new Error(`Odoo authentication failed for user: ${username} on db: ${db}`);
  }

  return uid;
}

/**
 * Fetches products from product.template model in Odoo
 * Fields: ['name', 'list_price', 'standard_price', 'image_1920', 'categ_id', 'uom_id']
 */
export async function fetchOdooProducts(
  domain: any[] = [],
  config: OdooAuthConfig = {}
): Promise<OdooProduct[]> {
  const { db, password } = getOdooConfig(config);

  // 1. Authenticate to obtain UID
  const uid = await authenticateOdoo(config);

  // 2. Query product.template using execute_kw
  const products = await callOdooJsonRpc<OdooProduct[]>(
    "object",
    "execute_kw",
    [
      db,
      uid,
      password,
      "product.template",
      "search_read",
      [domain],
      {
        fields: ["name", "list_price", "standard_price", "image_1920", "categ_id", "uom_id"],
        limit: 100,
        order: "name asc",
      },
    ],
    config
  );

  return products || [];
}

/**
 * Client-friendly helper to get products.
 * If called in browser, calls our Next.js API route to protect credentials & bypass CORS.
 * If called in Node.js server, calls Odoo directly.
 */
export async function getScrapProducts(): Promise<OdooProduct[]> {
  if (typeof window !== "undefined") {
    const res = await fetch("/api/odoo/products");
    if (!res.ok) {
      throw new Error(`Failed to fetch scrap products from API: ${res.statusText}`);
    }
    const json = await res.json();
    return json.products || [];
  }

  return fetchOdooProducts();
}
