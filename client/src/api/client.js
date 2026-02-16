// In production, VITE_API_URL points to the deployed server (e.g. https://eduquestjr-api.vercel.app)
// In development, Vite proxy forwards /api to localhost:5000
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

function getToken() {
  return localStorage.getItem('eduquest_token');
}

export async function api(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const auth = {
  register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
  updateProfile: (body) => api('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  verifyEmail: (body) => api('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
  resendVerification: (body) => api('/auth/resend-verification', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body) => api('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  verifyResetCode: (body) => api('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => api('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
};

export const users = {
  profile: () => api('/users/profile'),
};

export const children = {
  list: () => api('/children'),
  create: (body) => api('/children', { method: 'POST', body: JSON.stringify(body) }),
  get: (id) => api(`/children/${id}`),
  update: (id, body) => api(`/children/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => api(`/children/${id}`, { method: 'DELETE' }),
  analytics: (childId) => api(`/children/${childId}/analytics`),
  completedLevels: (childId, gameSlug) =>
    api(`/children/${childId}/completed-levels${gameSlug ? `?gameSlug=${encodeURIComponent(gameSlug)}` : ''}`),
};

export const games = {
  list: (params) => {
    const q = new URLSearchParams(params).toString();
    return api(q ? `/games?${q}` : '/games');
  },
  get: (slug) => api(`/games/${slug}`),
};

export const progress = {
  playStatus: (childId, gameSlug) =>
    api(`/children/${childId}/play-status?gameSlug=${encodeURIComponent(gameSlug)}`),
  submit: (body) =>
    api('/progress', { method: 'POST', body: JSON.stringify(body) }),
  listByChild: (childId) => api(`/children/${childId}/progress`),
};

export const ai = {
  hint: (gameType, context, score, accuracy, childAge) => {
    const params = new URLSearchParams({ gameType });
    if (context) params.set('context', context);
    if (score != null) params.set('score', score);
    if (accuracy != null) params.set('accuracy', accuracy);
    if (childAge != null) params.set('childAge', childAge);
    return api(`/ai/hint?${params}`);
  },
  recommendation: (childId) => api(`/ai/recommendation?childId=${childId}`),
  encouragement: (params) => {
    const q = new URLSearchParams(params).toString();
    return api(`/ai/encouragement?${q}`);
  },
  suggestedLevel: (childId, gameSlug) => api(`/ai/suggested-level?childId=${childId}&gameSlug=${gameSlug}`),
  chat: (childId, message, history = [], lang = 'en') =>
    api('/ai/chat', { method: 'POST', body: JSON.stringify({ childId, message, history, lang }) }),
};

export const subscription = {
  create: (planType = 'monthly') =>
    api('/subscription/create', { method: 'POST', body: JSON.stringify({ planType }) }),
  getPlanId: (planType = 'monthly') =>
    api('/subscription/plan-id', { method: 'POST', body: JSON.stringify({ planType }) }),
  activate: (subscriptionId, planType) =>
    api('/subscription/activate', { method: 'POST', body: JSON.stringify({ subscriptionId, planType }) }),
  startTrial: () =>
    api('/subscription/start-trial', { method: 'POST' }),
  status: () => api('/subscription/status'),
  sync: () => api('/subscription/sync'),
};

export const stickers = {
  list: () => api('/stickers'),
  buy: (childId, stickerSlug) => api('/stickers/buy', { method: 'POST', body: JSON.stringify({ childId, stickerSlug }) }),
  equip: (childId, stickerSlugs) => api('/stickers/equip', { method: 'POST', body: JSON.stringify({ childId, stickerSlugs }) }),
};

export const challenges = {
  daily: (childId) => api(`/challenges/daily${childId ? '?childId=' + childId : ''}`),
  dailyProgress: (childId) => api(`/challenges/daily/progress?childId=${childId}`),
  completeTask: (childId, taskId) => api('/challenges/daily/complete', { method: 'POST', body: JSON.stringify({ childId, taskId }) }),
};
