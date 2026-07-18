// Sliding window em memória.
// NOTA: em serverless cada instância tem seu próprio Map — não é um limite
// global. Suficiente para o login de um admin único; para rate-limit
// distribuído de verdade, trocar por Upstash/Redis (previsto na Fase 9).
type Hit = { count: number; resetAt: number };
const store = new Map<string, Hit>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // segundos
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const hit = store.get(key);

  if (!hit || hit.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  hit.count++;
  if (hit.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((hit.resetAt - now) / 1000),
    };
  }
  return { allowed: true, remaining: limit - hit.count, retryAfter: 0 };
}
