// src/utils/attemptLimiter.js

const STORAGE_KEY = 'phone_verify_attempts_v1';
const DEFAULT_COOLDOWN_MS = 60 * 1000; // 60 seconds
const DEFAULT_DAILY_LIMIT = 5;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
}

function getUserKey(user) {
  return user?.uid || user?.email || 'anon';
}

export function canAttemptVerification(user, options = {}) {
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const dailyLimit = options.dailyLimit ?? DEFAULT_DAILY_LIMIT;

  const data = load();
  const key = getUserKey(user);
  const day = todayKey();
  const entry = data[key] || {};

  const lastAt = entry.lastAttemptAt || 0;
  const since = Date.now() - lastAt;
  if (since < cooldownMs) {
    return { ok: false, reason: 'cooldown', waitMs: cooldownMs - since };
  }

  const dayCount = entry.countByDay?.[day] || 0;
  if (dayCount >= dailyLimit) {
    return { ok: false, reason: 'daily_limit', limit: dailyLimit };
  }

  return { ok: true };
}

export function recordVerificationAttempt(user) {
  const data = load();
  const key = getUserKey(user);
  const day = todayKey();
  const entry = data[key] || {};
  const counts = entry.countByDay || {};
  counts[day] = (counts[day] || 0) + 1;
  data[key] = {
    lastAttemptAt: Date.now(),
    countByDay: counts,
  };
  save(data);
}

export function resetVerificationCooldown(user) {
  const data = load();
  const key = getUserKey(user);
  const entry = data[key] || {};
  data[key] = { ...entry, lastAttemptAt: 0 };
  save(data);
}

