import { PrismaClient } from './config/prisma.js';
const prisma = new PrismaClient();
prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name IN ('assigneeName','priority')`
  .then(rows => {
    console.log('Columns:', rows);
    return prisma.$disconnect();
  })
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
