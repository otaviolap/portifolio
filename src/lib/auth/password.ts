import "server-only"; // barreira: bcrypt nunca vaza pro bundle do client
import bcrypt from "bcryptjs";

const ROUNDS = 12; // ~250ms — proposital, só acontece no login

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Hash "dummy" (12 rounds) para comparação de tempo constante quando o email
// não existe — assim o tempo de resposta não revela se o usuário existe.
export const DUMMY_HASH =
  "$2b$12$qyLs7ihYpC/nBz24kMC7uO7pV2lPOLdf/Gyha9HJPFJFKulHZcXMS";
