import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/** Boots the full AppModule (every module and provider wired together) without a database:
 * PrismaService is stubbed, so this smoke test never connects to — or writes to — whatever
 * DATABASE_URL points at, and the Prisma 7 client's ESM runtime never has to load under Jest. */
describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ product: { count: jest.fn().mockResolvedValue(4) } })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    // Scheduled jobs (AI knowledge re-sync) would otherwise start ticking inside the test run.
    for (const job of app.get(SchedulerRegistry).getCronJobs().values()) {
      void job.stop();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }: { body: { data: unknown } }) => {
        expect(body.data).toBe('Hello World!');
      });
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }: { body: { data: unknown } }) => {
        expect(body.data).toEqual({
          status: 'ok',
          database: 'connected',
          productCount: 4,
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
