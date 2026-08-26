import type { AiSyncService } from './ai-sync.service';

/** `AiSyncService`'s in-flight/pendingRerun/circuit-breaker state is intentionally module-level
 * (matches the pre-existing `syncInFlight` convention — see the file's own doc comments), so
 * each test needs a fresh module instance rather than a fresh class instance. `jest.isolateModules`
 * + `require` gives every test its own private copy of those module-level `let`s. */
function loadService(
  prisma: unknown,
  extractor: unknown,
  settingsService: unknown,
): AiSyncService {
  let ServiceCtor:
    | (new (
        prisma: unknown,
        extractor: unknown,
        settingsService: unknown,
      ) => AiSyncService)
    | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate: see doc comment above
    const mod = require('./ai-sync.service') as {
      AiSyncService: new (
        prisma: unknown,
        extractor: unknown,
        settingsService: unknown,
      ) => AiSyncService;
    };
    ServiceCtor = mod.AiSyncService;
  });
  return new ServiceCtor!(prisma, extractor, settingsService);
}

function buildPrisma() {
  const tx = {
    aiKnowledgeChunk: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    aiSyncStatus: { update: jest.fn().mockResolvedValue({}) },
  };
  return {
    aiSyncLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    aiSyncStatus: {
      findFirst: jest.fn().mockResolvedValue({ id: 'status-1' }),
      create: jest.fn().mockResolvedValue({ id: 'status-1' }),
      update: jest.fn().mockResolvedValue({}),
      upsert: jest.fn().mockResolvedValue({ id: 'status-1' }),
    },
    aiKnowledgeChunk: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    __tx: tx,
  };
}

async function waitUntil(fn: () => boolean, maxTicks = 200) {
  for (let i = 0; i < maxTicks; i++) {
    if (fn()) return;
    await Promise.resolve();
  }
  throw new Error('waitUntil: condition not met in time');
}

describe('AiSyncService.scheduleSync — basic dispatch', () => {
  it('starts a sync immediately when nothing is in flight', async () => {
    const prisma = buildPrisma();
    const settingsService = { getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }) };
    const extractor = {
      extractAll: jest
        .fn()
        .mockResolvedValue({ chunks: [], failedSources: [] }),
    };
    const service = loadService(prisma, extractor, settingsService);

    service.scheduleSync('publish:home');
    await waitUntil(() => prisma.aiSyncLog.create.mock.calls.length >= 1);

    const [createArgs] = prisma.aiSyncLog.create.mock.calls[0] as [
      { data: { trigger: string; status: string } },
    ];
    expect(createArgs.data).toMatchObject({
      trigger: 'publish:home',
      status: 'running',
    });
  });
});

describe('AiSyncService.scheduleSync — coalescing', () => {
  it('collapses multiple triggers that arrive while a sync is in flight into exactly one rerun', async () => {
    const prisma = buildPrisma();
    const settingsService = { getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }) };

    type ExtractResult = { chunks: unknown[]; failedSources: unknown[] };
    let releaseFirstExtract: (result: ExtractResult) => void = () => {};
    const firstExtract = new Promise<ExtractResult>((resolve) => {
      releaseFirstExtract = resolve;
    });
    const extractor = {
      extractAll: jest
        .fn()
        .mockImplementationOnce(() => firstExtract)
        .mockResolvedValue({ chunks: [], failedSources: [] }),
    };
    const service = loadService(prisma, extractor, settingsService);

    service.scheduleSync('publish:products'); // run #1 starts, blocks on extractAll
    await waitUntil(() => extractor.extractAll.mock.calls.length >= 1);

    // Three more triggers while run #1 is still in flight — must coalesce into one rerun, not three.
    service.scheduleSync('publish:products');
    service.scheduleSync('publish:products');
    service.scheduleSync('publish:products');
    expect(prisma.aiSyncLog.create).toHaveBeenCalledTimes(1);

    releaseFirstExtract({ chunks: [], failedSources: [] });
    await waitUntil(() => extractor.extractAll.mock.calls.length >= 2); // rerun started
    await waitUntil(() => prisma.aiSyncLog.create.mock.calls.length >= 2); // rerun finished creating its own log
    await waitUntil(() => prisma.aiSyncLog.update.mock.calls.length >= 2); // both runs completed

    expect(prisma.aiSyncLog.create).toHaveBeenCalledTimes(2);
    expect(extractor.extractAll).toHaveBeenCalledTimes(2);
  });

  it('does not start a second overlapping run when nothing is pending after the first finishes', async () => {
    const prisma = buildPrisma();
    const settingsService = { getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }) };
    const extractor = {
      extractAll: jest
        .fn()
        .mockResolvedValue({ chunks: [], failedSources: [] }),
    };
    const service = loadService(prisma, extractor, settingsService);

    service.scheduleSync('publish:contact');
    await waitUntil(() => prisma.aiSyncLog.update.mock.calls.length >= 1);

    expect(prisma.aiSyncLog.create).toHaveBeenCalledTimes(1);
  });
});

describe('AiSyncService — automatic-sync circuit breaker', () => {
  it('suppresses scheduleSync (but not runSync directly) after 3 consecutive failures', async () => {
    const prisma = buildPrisma();
    const settingsService = { getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }) };
    const extractor = { extractAll: jest.fn().mockRejectedValue(new Error('boom')) };
    const service = loadService(prisma, extractor, settingsService);

    // Drives the failure counter via `runSync` directly (awaited to full completion, including
    // its `finally` block) rather than `scheduleSync` — `scheduleSync` is fire-and-forget, so
    // there's no way to know from the outside exactly when one trigger's run has fully finished
    // and it's safe to start counting the next one.
    for (let i = 1; i <= 3; i += 1) {
      await service.runSync('publish:products');
    }

    const statusAfterThree = await service.getStatus();
    expect(statusAfterThree.auto_sync_suppressed).toBe(true);

    prisma.aiSyncLog.create.mockClear();
    service.scheduleSync('publish:products'); // 4th automatic trigger — must be skipped entirely
    await Promise.resolve();
    await Promise.resolve();
    expect(prisma.aiSyncLog.create).not.toHaveBeenCalled();

    // Manual ("Sync Now") bypasses scheduleSync entirely (matches AdminAiController.sync()) and
    // must remain reachable even while automatic sync is suppressed.
    const manualResult = await service.runSync('manual');
    expect(prisma.aiSyncLog.create).toHaveBeenCalledTimes(1);
    expect(manualResult.success).toBe(false); // extractAll still rejects in this test
  });

  it('a successful run clears the suppression and resets the failure counter', async () => {
    const prisma = buildPrisma();
    const settingsService = { getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }) };
    const extractor = { extractAll: jest.fn().mockRejectedValue(new Error('boom')) };
    const service = loadService(prisma, extractor, settingsService);

    // Drives the failure counter via `runSync` directly (awaited to full completion, including
    // its `finally` block) rather than `scheduleSync` — `scheduleSync` is fire-and-forget, so
    // there's no way to know from the outside exactly when one trigger's run has fully finished
    // and it's safe to start counting the next one.
    for (let i = 1; i <= 3; i += 1) {
      await service.runSync('publish:products');
    }
    expect((await service.getStatus()).auto_sync_suppressed).toBe(true);

    // the underlying problem is now fixed
    extractor.extractAll.mockResolvedValue({ chunks: [], failedSources: [] });
    await service.runSync('manual');
    expect((await service.getStatus()).auto_sync_suppressed).toBe(false);

    // scheduleSync (the publish-triggered path) works again immediately.
    prisma.aiSyncLog.create.mockClear();
    service.scheduleSync('publish:products');
    await waitUntil(() => prisma.aiSyncLog.create.mock.calls.length >= 1);
    expect(prisma.aiSyncLog.create).toHaveBeenCalledTimes(1);
  });

  it('the 5-minute cron (scheduledResync) is never gated by autoSyncSuppressed', async () => {
    const prisma = buildPrisma();
    const settingsService = { getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }) };
    const extractor = { extractAll: jest.fn().mockRejectedValue(new Error('boom')) };
    const service = loadService(prisma, extractor, settingsService);

    // Drives the failure counter via `runSync` directly (awaited to full completion, including
    // its `finally` block) rather than `scheduleSync` — `scheduleSync` is fire-and-forget, so
    // there's no way to know from the outside exactly when one trigger's run has fully finished
    // and it's safe to start counting the next one.
    for (let i = 1; i <= 3; i += 1) {
      await service.runSync('publish:products');
    }
    expect((await service.getStatus()).auto_sync_suppressed).toBe(true);

    prisma.aiSyncLog.create.mockClear();
    await service.scheduledResync();
    expect(prisma.aiSyncLog.create).toHaveBeenCalledTimes(1);
  });
});

describe('AiSyncService.getStatus', () => {
  it('reports auto_sync_suppressed: false when nothing has failed', async () => {
    const prisma = buildPrisma();
    const settingsService = { getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }) };
    const extractor = {
      extractAll: jest
        .fn()
        .mockResolvedValue({ chunks: [], failedSources: [] }),
    };
    const service = loadService(prisma, extractor, settingsService);

    const status = await service.getStatus();

    expect(status.auto_sync_suppressed).toBe(false);
  });
});

describe('AiSyncService.runSync — failedCount persistence (Phase P0.4-D4/P1-5, Option A)', () => {
  it('G. persists failedCount equal to the number of failed source groups reported by extractAll()', async () => {
    const prisma = buildPrisma();
    const settingsService = {
      getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }),
    };
    const extractor = {
      extractAll: jest.fn().mockResolvedValue({
        chunks: [{ sourceKey: 'home' }],
        failedSources: ['products'],
      }),
    };
    const service = loadService(prisma, extractor, settingsService);

    const result = await service.runSync('manual');

    expect(result.success).toBe(true);
    const [updateArgs] = prisma.__tx.aiSyncStatus.update.mock.calls[0] as [
      { data: { failedCount: number; indexedCount: number } },
    ];
    expect(updateArgs.data.failedCount).toBe(1);
    expect(updateArgs.data.indexedCount).toBe(1);
  });

  it('H. a clean sync (no failed groups) persists failedCount: 0', async () => {
    const prisma = buildPrisma();
    const settingsService = {
      getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }),
    };
    const extractor = {
      extractAll: jest
        .fn()
        .mockResolvedValue({ chunks: [], failedSources: [] }),
    };
    const service = loadService(prisma, extractor, settingsService);

    await service.runSync('manual');

    const [updateArgs] = prisma.__tx.aiSyncStatus.update.mock.calls[0] as [
      { data: { failedCount: number } },
    ];
    expect(updateArgs.data.failedCount).toBe(0);
  });

  it('persists failedCount equal to the count of distinct failed groups, not the number of failed locale attempts', async () => {
    const prisma = buildPrisma();
    const settingsService = {
      getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }),
    };
    const extractor = {
      extractAll: jest.fn().mockResolvedValue({
        chunks: [],
        failedSources: ['contact', 'about_company'],
      }),
    };
    const service = loadService(prisma, extractor, settingsService);

    await service.runSync('manual');

    const [updateArgs] = prisma.__tx.aiSyncStatus.update.mock.calls[0] as [
      { data: { failedCount: number } },
    ];
    expect(updateArgs.data.failedCount).toBe(2);
  });

  it('I. a whole-sync failure (extractAll rejects) leaves failedCount/indexedCount untouched — only lastStatus/lastError are written, exactly as before this phase', async () => {
    const prisma = buildPrisma();
    const settingsService = {
      getOrCreateRaw: jest.fn().mockResolvedValue({ enabled: true }),
    };
    const extractor = {
      extractAll: jest.fn().mockRejectedValue(new Error('boom')),
    };
    const service = loadService(prisma, extractor, settingsService);

    const result = await service.runSync('manual');

    expect(result.success).toBe(false);
    const [updateArgs] = prisma.aiSyncStatus.update.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(updateArgs.data).toEqual({
      lastStatus: 'failed',
      lastError: 'boom',
    });
    expect(updateArgs.data.failedCount).toBeUndefined();
  });
});
