import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || (() => {
    try {
        return new PrismaClient();
    } catch (error) {
        console.error('Prisma Client initialization error:', error);
        // Return a mock client during build time if Prisma isn't generated yet
        return new PrismaClient();
    }
})();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
