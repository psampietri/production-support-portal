import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// This prevents creating a new client on every hot-reload in development
const globalForPrisma = globalThis;

export const pool = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = pool;