import { PrismaClient } from "@prisma/client";

// Singleton via globalThis: em dev o HMR do Next recria módulos a cada save;
// sem o cache global, cada reload abre uma nova pool e esgota o limite da Neon.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
