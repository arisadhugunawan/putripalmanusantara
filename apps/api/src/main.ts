import 'dotenv/config';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { assertNoProductionAuthBypass } from './common/utils/assert-no-production-auth-bypass';
import { csrfHeaderMiddleware } from './common/middleware/csrf-header.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  assertNoProductionAuthBypass();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind a hosting proxy (e.g. Render) every request arrives from the proxy's own IP unless
  // Express trusts it, which would make the per-IP rate limits (login, public forms) shared by
  // every visitor. Opt-in via TRUST_PROXY (a hop count, e.g. "1") so a server exposed directly
  // can't have its client IP spoofed through X-Forwarded-For.
  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy) {
    app.set(
      'trust proxy',
      /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy,
    );
  }

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Helmet's default `frame-ancestors 'self'` blocks the Admin (web origin) from embedding a
  // PDF served from this API in the document preview modal. Widened to exactly the origins
  // already trusted for credentialed CORS — never a wildcard — so uploaded documents can be
  // previewed in-place while every other origin stays blocked from framing this API.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { 'frame-ancestors': ["'self'", ...corsOrigins] },
      },
      // This API's /uploads/* media is meant to be embedded as <img> on the public site — the
      // default `same-origin` (or `same-site`) policy blocks that whenever the web origin and
      // this API sit on different sites, e.g. web/API served from two different subdomains of a
      // shared PSL-listed parent (as happens with the dev-only Cloudflare/localtunnel quick
      // tunnels, each `*.trycloudflare.com`/`*.loca.lt` subdomain is its own "site").
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  app.enableCors({ origin: corsOrigins, credentials: true });
  app.use(csrfHeaderMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Local media storage (docs/06-architecture.md §2 — MEDIA_STORAGE_DRIVER=local for dev).
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
