// Runnable entrypoint for the P0.2b-A Article snapshot backfill — see
// `backfill-article-published-snapshots.ts` for the actual (pure, testable) logic. Split into
// two files so the logic module has zero side effects on import (safe for Jest); this file is
// the only one that opens a real database connection.
//
// Run: npm run prisma:backfill-article-snapshots --workspace=apps/api
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { backfillArticlePublishedSnapshots } from './backfill-article-published-snapshots';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

backfillArticlePublishedSnapshots(prisma)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
