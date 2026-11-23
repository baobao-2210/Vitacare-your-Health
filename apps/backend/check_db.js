const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const summaries = await prisma.activityDailySummary.findMany({ orderBy: { updatedAt: 'desc' }, take: 2 });
  console.log('Daily Summaries:', JSON.stringify(summaries, null, 2));

  const sessions = await prisma.activitySession.findMany({ orderBy: { createdAt: 'desc' }, take: 4 });
  console.log('Recent Sessions:', JSON.stringify(sessions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

