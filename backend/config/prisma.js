import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const globalForPrisma = global;
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
