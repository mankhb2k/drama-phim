import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});

export const prisma = new PrismaClient({ adapter, log: ["error"] });
