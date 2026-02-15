const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const BASE_URL =
  PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;

const PLANS_CONFIG = {
  monthly: { price: '9.99', interval: 'MONTH', intervalCount: 1, months: 1, name: 'Monthly' },
  '6months': { price: '49.99', interval: 'MONTH', intervalCount: 6, months: 6, name: '6 Months' },
  yearly: { price: '79.99', interval: 'YEAR', intervalCount: 1, months: 12, name: 'Yearly' },
};

let cachedToken = null;
let tokenExpiry = 0;
const cachedPlanIds = {};

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function paypalFetch(path, options = {}) {
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
  if (!res.ok) {
    const details = data.details ? data.details.map(d => `${d.field}: ${d.description || d.issue}`).join('; ') : '';
    const errMsg = details || data.message || data.error_description || data.name || `PayPal ${res.status}`;
    console.error('[PayPal Error]', res.status, errMsg, JSON.stringify(data, null, 2));
    throw new Error(errMsg);
  }
  return data;
}

export function getPlansConfig() {
  return PLANS_CONFIG;
}

let productId = null;

async function getOrCreateProduct() {
  if (productId) return productId;
  if (process.env.PAYPAL_PRODUCT_ID) {
    productId = process.env.PAYPAL_PRODUCT_ID;
    return productId;
  }

  // First try to find an existing product
  try {
    const list = await paypalFetch('/v1/catalogs/products?page_size=10&page=1&total_required=true');
    const existing = list.products?.find(p => p.name === 'EduQuestJr Premium');
    if (existing) {
      productId = existing.id;
      console.log('[PayPal] Using existing product:', productId);
      return productId;
    }
  } catch (_) {
    // ignore listing errors, try creating
  }

  const data = await paypalFetch('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify({
      name: 'EduQuestJr Premium',
      description: 'Unlimited learning for ages 1-8. Full game library, analytics, no daily limit.',
      type: 'SERVICE',
      category: 'EDUCATIONAL_AND_TEXTBOOKS',
    }),
  });
  productId = data.id;
  console.log('[PayPal] Created new product:', productId);
  return productId;
}

async function getOrCreatePlanId(planType) {
  const envKey = `PAYPAL_PLAN_${planType.toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey];
  if (cachedPlanIds[planType]) return cachedPlanIds[planType];

  const config = PLANS_CONFIG[planType] || PLANS_CONFIG.monthly;
  const prodId = await getOrCreateProduct();

  const data = await paypalFetch('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify({
      product_id: prodId,
      name: `EduQuestJr Premium ${config.name}`,
      description: `${config.name} subscription - unlimited play, full library`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: { interval_unit: config.interval, interval_count: config.intervalCount },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: config.price, currency_code: 'USD' },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  cachedPlanIds[planType] = data.id;
  return data.id;
}

// Public wrapper for getting plan ID (used by frontend SDK)
export async function getOrCreatePlanIdPublic(planType) {
  const planId = await getOrCreatePlanId(planType || 'monthly');
  return { planId };
}

export async function createSubscription(userId, userEmail, userName, planType, returnUrl, cancelUrl) {
  const planId = await getOrCreatePlanId(planType || 'monthly');
  const data = await paypalFetch('/v1/billing/subscriptions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: String(userId),
      application_context: {
        brand_name: 'EduQuestJr',
        locale: 'en-US',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
      subscriber: {
        email_address: userEmail,
        name: { given_name: userName || 'Member' },
      },
    }),
  });
  const approveLink = data.links?.find((l) => l.rel === 'approve')?.href;
  return { subscriptionId: data.id, approvalUrl: approveLink, status: data.status };
}

export async function getSubscriptionDetails(subscriptionId) {
  return paypalFetch(`/v1/billing/subscriptions/${subscriptionId}`);
}
