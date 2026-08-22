import type { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiException } from '../../common/exceptions/api.exception';
import { CONTENT_PUBLISHED_EVENT } from '../../common/events/content-published.event';
import { HomepageService } from './homepage.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ProductionStepsService } from '../production-steps/production-steps.service';
import type { SupplyNetworkService } from '../supply-network/supply-network.service';

function buildService() {
  const homepagePublishedSnapshot = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, [{ data: Record<string, unknown> }]>(),
  };
  const prisma = {
    homepagePublishedSnapshot,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const events = { emit: jest.fn() };
  return {
    service: new HomepageService(
      prisma as unknown as PrismaService,
      {} as unknown as ProductionStepsService,
      {} as unknown as SupplyNetworkService,
      events as unknown as EventEmitter2,
    ),
    homepagePublishedSnapshot,
    events,
  };
}

describe('HomepageService.restoreSnapshot', () => {
  it('emits content.published with source="home" after the restore transaction commits', async () => {
    const { service, homepagePublishedSnapshot, events } = buildService();
    homepagePublishedSnapshot.findUnique.mockResolvedValue({
      id: 'snap-1',
      data: { hero_slides: [] },
    });
    homepagePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-2',
      publishedAt: new Date('2026-08-22T00:00:00.000Z'),
    });

    await service.restoreSnapshot('snap-1');

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'home',
    });
  });

  it('does not emit content.published when the snapshot does not exist (restore never starts)', async () => {
    const { service, homepagePublishedSnapshot, events } = buildService();
    homepagePublishedSnapshot.findUnique.mockResolvedValue(null);

    await expect(service.restoreSnapshot('missing')).rejects.toThrow(
      ApiException,
    );

    expect(events.emit).not.toHaveBeenCalled();
  });
});
