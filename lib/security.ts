type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const JWT_SECRET_FALLBACK = 'your-secret-key';
const MIN_JWT_SECRET_LENGTH = 32;

const globalForSecurity = globalThis as typeof globalThis & {
  loginRateLimitStore?: Map<string, RateLimitBucket>;
};

function getRateLimitStore() {
  if (!globalForSecurity.loginRateLimitStore) {
    globalForSecurity.loginRateLimitStore = new Map<string, RateLimitBucket>();
  }

  return globalForSecurity.loginRateLimitStore;
}

export function getJwtSecret() {
  const value = process.env.JWT_SECRET?.trim();

  if (!value) {
    throw new Error('JWT_SECRET wajib diatur sebelum aplikasi dijalankan.');
  }

  if (value === JWT_SECRET_FALLBACK || value.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error('JWT_SECRET tidak aman. Gunakan secret acak dengan panjang minimal 32 karakter.');
  }

  return value;
}

export function consumeLoginRateLimit(
  key: string,
  {
    maxAttempts,
    windowMs,
  }: {
    maxAttempts: number;
    windowMs: number;
  },
): RateLimitResult {
  const now = Date.now();
  const store = getRateLimitStore();
  const currentBucket = store.get(key);

  if (!currentBucket || currentBucket.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (currentBucket.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((currentBucket.resetAt - now) / 1000)),
    };
  }

  currentBucket.count += 1;
  store.set(key, currentBucket);

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - currentBucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((currentBucket.resetAt - now) / 1000)),
  };
}

export function clearLoginRateLimit(key: string) {
  getRateLimitStore().delete(key);
}
