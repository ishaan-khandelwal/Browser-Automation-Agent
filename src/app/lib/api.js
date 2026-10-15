/**
 * Browser Agent Backend API Client
 * Uses Next.js proxy rewrites: /api/* -> http://localhost:8000/api/*
 * So all fetch calls use relative URLs (/api/v1/...) automatically.
 * WebSocket still needs the full URL since rewrites don't apply to WS.
 */

const API = '/api/v1';
const WS_BASE = (typeof window !== 'undefined')
  ? window.location.origin.replace(/^http/, 'ws')
  : 'ws://localhost:3000';

// ── Token store ──────────────────────────────────────────────────────────────
let _accessToken = null;
export function setAccessToken(token) { _accessToken = token; }
export function getAccessToken() { return _accessToken; }
export function clearAccessToken() { _accessToken = null; }

// ── Core fetch ───────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  // A refresh may be in flight (page load, another request's 401). Wait for it,
  // so this request goes out with the new token instead of an old or empty one.
  if (_refreshing && !path.startsWith('/auth/')) await _refreshing;

  const sentToken = _accessToken;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (sentToken) headers['Authorization'] = `Bearer ${sentToken}`;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // 401 -> refresh once, then retry once.
  if (res.status === 401 && !options._retried && !path.startsWith('/auth/')) {
    // If another request already replaced the token while this one was in
    // flight, retry with it instead of spending (and rotating) the cookie again.
    const refreshed = _accessToken && _accessToken !== sentToken ? true : await tryRefresh();
    if (refreshed) return apiFetch(path, { ...options, _retried: true });
  }

  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const b = await res.json();
      msg = b.error?.message || b.detail || b.message || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function register({ email, password, displayName, name }) {
  const finalName = (name || displayName || email.split('@')[0]).trim();
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: finalName }),
  });
}

export async function login({ email, password }) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } finally { clearAccessToken(); }
}

// Refresh tokens are single-use and the backend treats a second use as theft,
// so only ONE refresh may be in flight. Callers in this tab share a promise;
// other tabs queue behind a Web Lock and then read the cookie the first tab set.
let _refreshing = null;

async function doRefresh() {
  try {
    const data = await apiFetch('/auth/refresh', { method: 'POST', _retried: true });
    if (data?.accessToken) { setAccessToken(data.accessToken); return true; }
  } catch { clearAccessToken(); }
  return false;
}

export function tryRefresh() {
  if (!_refreshing) {
    const run = (typeof navigator !== 'undefined' && navigator.locks)
      ? () => navigator.locks.request('baa-refresh', doRefresh)
      : doRefresh;
    _refreshing = run().finally(() => { _refreshing = null; });
  }
  return _refreshing;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

// ── Tasks ────────────────────────────────────────────────────────────────────
export async function createTask({ instruction, startUrl }) {
  return apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify({ instruction, startUrl: startUrl || null }),
  });
}

export async function getTask(taskId) {
  return apiFetch(`/tasks/${taskId}`);
}

export async function listTasks({ page = 1, pageSize = 20 } = {}) {
  return apiFetch(`/tasks?page=${page}&pageSize=${pageSize}`);
}

export async function cancelTask(taskId) {
  return apiFetch(`/tasks/${taskId}/cancel`, { method: 'POST' });
}

// The backend rejects a body whose `approved` disagrees with the route.
export async function approveTask(taskId, reason) {
  return apiFetch(`/tasks/${taskId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approved: true, reason: reason || null }),
  });
}

export async function rejectTask(taskId, reason) {
  return apiFetch(`/tasks/${taskId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ approved: false, reason: reason || null }),
  });
}

// ── Stats ────────────────────────────────────────────────────────────────────
export async function getStatsOverview(scope = 'mine') {
  return apiFetch(`/stats/overview?scope=${scope}`);
}

// ── WebSocket stream ─────────────────────────────────────────────────────────
// WS bypasses Next.js rewrites, so we proxy through backend directly
// The backend runs at NEXT_PUBLIC_BACKEND_WS_URL or defaults to ws://localhost:8000
const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:8000';

export async function openTaskStream(taskId, { onEvent, onClose, afterStep = 0 } = {}) {
  const ticketRes = await apiFetch(`/tasks/${taskId}/stream-ticket`, { method: 'POST' });
  const ticket = ticketRes?.ticket;
  if (!ticket) throw new Error('No stream ticket received');

  const wsUrl = `${BACKEND_WS}/api/v1/tasks/${taskId}/stream?ticket=${encodeURIComponent(ticket)}&after_step=${afterStep}`;
  const ws = new WebSocket(wsUrl);

  ws.addEventListener('message', (e) => {
    try {
      const event = JSON.parse(e.data);
      if (event.type === 'heartbeat') { ws.send(JSON.stringify({ type: 'ping' })); return; }
      onEvent?.(event);
    } catch {}
  });

  ws.addEventListener('close', () => onClose?.());
  ws.addEventListener('error', () => onClose?.());

  return { ws, close: () => ws.close() };
}
