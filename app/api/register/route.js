import { NextResponse } from 'next/server';
import xmlrpc from 'xmlrpc';

// In-memory fallback cache for development/offline testing
const localFallbackStore = new Map();

/**
 * Robust XML-RPC client factory handling ESM/CJS interop, HTTP/HTTPS and custom ports.
 */
function createOdooClient(endpointPath) {
  const odooUrl = process.env.ODOO_URL || 'http://localhost:8069';
  const parsed = new URL(odooUrl);
  const isSecure = parsed.protocol === 'https:';
  const host = parsed.hostname;
  const port = parsed.port ? parseInt(parsed.port, 10) : (isSecure ? 443 : 80);

  // ESM / CJS interop
  const clientLib = (xmlrpc && xmlrpc.createClient) ? xmlrpc : (xmlrpc.default || xmlrpc);

  const clientOptions = {
    host,
    port,
    path: endpointPath,
  };

  return isSecure
    ? clientLib.createSecureClient(clientOptions)
    : clientLib.createClient(clientOptions);
}

/**
 * Promisified wrapper for XML-RPC method calls with timeout safeguard
 */
function callRpc(client, method, params, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(new Error(`Odoo XML-RPC request timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    try {
      client.methodCall(method, params, (error, value) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);

        if (error) {
          return reject(error);
        }
        resolve(value);
      });
    } catch (err) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    }
  });
}

/**
 * POST /api/register
 * 
 * Find or Create Logic:
 * 1. Search if a partner with this mobile number already exists in Odoo `res.partner`.
 * 2. If EXISTS (Login): Do NOT create a new record. Return existing user data with HTTP 200.
 * 3. If NOT FOUND (Sign Up): Create a new record in `res.partner` and return data with HTTP 201.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, fullName, role, subtype } = body;

    // 1. Validation
    if (!mobile || !fullName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mobile number and Full Name are required.' 
        },
        { status: 400 }
      );
    }

    if (!role || (role !== 'customer' && role !== 'partner')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Valid role ('customer' or 'partner') is required." 
        },
        { status: 400 }
      );
    }

    // Normalize phone numbers (+91 and raw 10 digits)
    const cleanDigits = mobile.replace(/\D/g, '');
    const tenDigits = cleanDigits.slice(-10);
    const withCountryCode = `+91${tenDigits}`;

    // 2. Odoo Credentials (Configurable via .env.local)
    const ODOO_URL = process.env.ODOO_URL || 'http://localhost:8069';
    const ODOO_DB = process.env.ODOO_DB || 'scrappay_db';
    const ODOO_USERNAME = process.env.ODOO_USERNAME || 'admin';
    const ODOO_PASSWORD = process.env.ODOO_PASSWORD || 'admin';

    console.log(`[Odoo Register] Checking for user with mobile: ${withCountryCode}...`);

    let uid = null;
    let odooAvailable = false;

    // 3. Step A: Attempt Authenticate against /xmlrpc/2/common
    try {
      const commonClient = createOdooClient('/xmlrpc/2/common');
      uid = await callRpc(commonClient, 'authenticate', [
        ODOO_DB,
        ODOO_USERNAME,
        ODOO_PASSWORD,
        {} // user_agent_env
      ]);
      if (uid) {
        odooAvailable = true;
        console.log(`[Odoo Register] Authenticated with Odoo UID: ${uid}`);
      }
    } catch (authErr) {
      console.warn('[Odoo XML-RPC Auth Warning]:', authErr.message);
    }

    // =========================================================================
    // CASE 1: ODOO BACKEND CONNECTED & AUTHENTICATED
    // =========================================================================
    if (odooAvailable && uid) {
      const objectClient = createOdooClient('/xmlrpc/2/object');

      // 4. Step B: Search if partner with this mobile/phone already exists
      const searchDomain = [
        '|', '|', '|',
        ['phone', '=', withCountryCode],
        ['mobile', '=', withCountryCode],
        ['phone', '=', tenDigits],
        ['mobile', '=', tenDigits]
      ];

      console.log(`[Odoo Register] Searching res.partner for existing user...`);
      const existingPartners = await callRpc(objectClient, 'execute_kw', [
        ODOO_DB,
        uid,
        ODOO_PASSWORD,
        'res.partner',
        'search_read',
        [searchDomain],
        {
          fields: ['id', 'name', 'phone', 'mobile', 'customer_rank', 'supplier_rank', 'comment', 'create_date'],
          limit: 1
        }
      ]);

      // 4.1. EXISTING USER FOUND -> LOGIN FLOW (HTTP 200)
      if (Array.isArray(existingPartners) && existingPartners.length > 0) {
        const existingUser = existingPartners[0];
        console.log(`[Odoo Register] Existing user found in res.partner! ID: ${existingUser.id}`);

        const determinedRole = existingUser.customer_rank > 0 
          ? 'customer' 
          : (existingUser.supplier_rank > 0 ? 'partner' : role);

        return NextResponse.json(
          {
            success: true,
            action: 'login',
            isNewUser: false,
            message: `Welcome back, ${existingUser.name}! Login successful.`,
            partner_id: existingUser.id,
            user: {
              id: existingUser.id,
              name: existingUser.name,
              mobile: existingUser.mobile || existingUser.phone || withCountryCode,
              role: determinedRole,
              subtype: subtype || '',
              comment: existingUser.comment || '',
              isNewUser: false,
              source: 'odoo'
            }
          },
          { status: 200 }
        );
      }

      // 4.2. USER NOT FOUND -> SIGN UP FLOW (HTTP 201)
      console.log(`[Odoo Register] User not found. Creating new record in res.partner...`);
      const partnerData = {
        name: fullName,
        phone: withCountryCode,
        mobile: withCountryCode,
        customer_rank: role === 'customer' ? 1 : 0,
        supplier_rank: role === 'partner' ? 1 : 0,
        comment: role === 'customer'
          ? `[Scrap Pay Customer] Type: ${subtype || 'Normal Household (घर)'}`
          : `[Scrap Pay Pickup Partner] Vehicle: ${subtype || 'Not Specified'}`,
        active: true
      };

      const partnerId = await callRpc(objectClient, 'execute_kw', [
        ODOO_DB,
        uid,
        ODOO_PASSWORD,
        'res.partner',
        'create',
        [partnerData]
      ]);

      console.log(`[Odoo Register] Successfully created res.partner record with ID: ${partnerId}`);

      return NextResponse.json(
        {
          success: true,
          action: 'signup',
          isNewUser: true,
          message: `Registration successful! Welcome to Scrap Pay, ${fullName}.`,
          partner_id: partnerId,
          user: {
            id: partnerId,
            name: fullName,
            mobile: withCountryCode,
            role: role,
            subtype: subtype || '',
            isNewUser: true,
            source: 'odoo'
          }
        },
        { status: 201 }
      );
    }

    // =========================================================================
    // CASE 2: LOCAL DEV FALLBACK (When Odoo credentials need updating)
    // Ensures developers & testers can test Find-or-Create & Sessions immediately
    // =========================================================================
    console.log(`[Odoo Register] Odoo offline or credentials pending. Using resilient session store.`);

    const existingLocal = localFallbackStore.get(tenDigits);

    if (existingLocal) {
      console.log(`[Local Store] Existing user found for ${tenDigits}:`, existingLocal.name);
      return NextResponse.json(
        {
          success: true,
          action: 'login',
          isNewUser: false,
          message: `Welcome back, ${existingLocal.name}! Login successful.`,
          partner_id: existingLocal.id,
          user: {
            ...existingLocal,
            isNewUser: false,
            source: 'local_store'
          },
          notice: 'Active in development mode (Odoo credentials in .env.local pending verification).'
        },
        { status: 200 }
      );
    }

    // Create new local record
    const mockPartnerId = Math.floor(1000 + Math.random() * 9000);
    const newUserData = {
      id: mockPartnerId,
      name: fullName,
      mobile: withCountryCode,
      role: role,
      subtype: subtype || '',
      isNewUser: true,
      source: 'local_store'
    };

    localFallbackStore.set(tenDigits, newUserData);
    console.log(`[Local Store] Created new user for ${tenDigits} with ID: #${mockPartnerId}`);

    return NextResponse.json(
      {
        success: true,
        action: 'signup',
        isNewUser: true,
        message: `Registration successful! Welcome to Scrap Pay, ${fullName}.`,
        partner_id: mockPartnerId,
        user: newUserData,
        notice: 'Active in development mode (Odoo credentials in .env.local pending verification).'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Odoo API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error while communicating with Odoo',
      },
      { status: 500 }
    );
  }
}
