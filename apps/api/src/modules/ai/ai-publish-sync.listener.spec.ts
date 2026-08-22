import { AiPublishSyncListener } from './ai-publish-sync.listener';
import type { AiSyncService } from './ai-sync.service';

function buildListener() {
  const syncService = { scheduleSync: jest.fn() };
  return {
    listener: new AiPublishSyncListener(syncService as unknown as AiSyncService),
    syncService,
  };
}

describe('AiPublishSyncListener', () => {
  it('labels the trigger as "publish:<source>" and forwards to AiSyncService.scheduleSync', () => {
    const { listener, syncService } = buildListener();

    listener.handleContentPublished({ source: 'products', entityId: 'p1' });

    expect(syncService.scheduleSync).toHaveBeenCalledTimes(1);
    expect(syncService.scheduleSync).toHaveBeenCalledWith('publish:products');
  });

  it.each([
    ['home', 'publish:home'],
    ['about_company', 'publish:about_company'],
    ['contact', 'publish:contact'],
  ] as const)('handles source=%s (no entityId) as trigger=%s', (source, expectedTrigger) => {
    const { listener, syncService } = buildListener();

    listener.handleContentPublished({ source });

    expect(syncService.scheduleSync).toHaveBeenCalledWith(expectedTrigger);
  });
});
