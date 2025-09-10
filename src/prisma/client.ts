import { PrismaClient } from '@prisma/client';

declare global {
  // ⚠️ importante: aquí NO declaramos PrismaClient como any,
  // declaramos la variable global con el tipo PrismaClient
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
