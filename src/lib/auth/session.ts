// Edge-safe: ZERO import de Node/Prisma. É o que permite o middleware verificar
// a sessão sem bcrypt e sem tocar o banco. Ver docs/05-auth.md §5.2.
import { SignJWT, jwtVerify } from "jose";

const secretString = process.env.AUTH_SECRET;
if (!secretString) {
  throw new Error("AUTH_SECRET não definido — necessário para assinar a sessão.");
}
const secret = new TextEncoder().encode(secretString);
const ALG = "HS256";
const ISSUER = "portfolio";
const AUDIENCE = "admin";

export type SessionPayload = { sub: string; email: string; tv: number };

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ email: p.email, tv: p.tv })
    .setProtectedHeader({ alg: ALG })
    .setSubject(p.sub)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySession(
  token?: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALG], // barra ataque alg:none / confusão de algoritmo
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      tv: payload.tv as number,
    };
  } catch {
    return null;
  }
}
