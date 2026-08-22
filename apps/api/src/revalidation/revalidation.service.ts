import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Notifies the Next.js frontend to revalidate cached pages after a CMS publish/update,
 * per docs/06-architecture.md §4/§7.1. Best-effort: the admin mutation has already
 * succeeded in the database by the time this runs, so a failure here (e.g. the frontend
 * route doesn't exist yet, or is temporarily down) must not fail the admin action.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * `type: 'layout'` invalidates every page rendered through the layout matching the given
   * path(s), not just that one page — needed for Branding (Header/Footer live in the shared
   * `[locale]/layout.tsx`, which wraps every public route, not only `/`).
   */
  async revalidate(
    paths: string[],
    type: 'page' | 'layout' = 'page',
  ): Promise<void> {
    const webAppUrl = this.config.get<string>('WEB_APP_URL');
    const secret = this.config.get<string>('REVALIDATE_SECRET');
    if (!webAppUrl || !secret) return;

    try {
      const response = await fetch(`${webAppUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, paths, type }),
      });
      if (!response.ok) {
        this.logger.warn(
          `Revalidation webhook responded with ${response.status}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Revalidation webhook unreachable: ${(error as Error).message}`,
      );
    }
  }
}
