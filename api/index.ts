import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    'info',
  ],
});

export default async (request: VercelRequest, response: VercelResponse) => {
  const testResults = await prisma.test.findMany();
  const { name } = request.query;
  response.status(200).send(JSON.stringify({ testResults }));
};
