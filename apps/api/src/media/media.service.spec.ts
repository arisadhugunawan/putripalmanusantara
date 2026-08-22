import {
  MediaService,
  sanitizeSvg,
  verifyFileSignature,
} from './media.service';
import { findLiveUsage } from './media-usage-registry';
import { findSnapshotUsage } from './media-snapshot-registry';
import type { PrismaService } from '../prisma/prisma.service';
import type { UploadedFileInput } from './storage/storage-driver.interface';

jest.mock('./media-usage-registry');
jest.mock('./media-snapshot-registry');
const mockFindLiveUsage = findLiveUsage as jest.MockedFunction<
  typeof findLiveUsage
>;
const mockFindSnapshotUsage = findSnapshotUsage as jest.MockedFunction<
  typeof findSnapshotUsage
>;

describe('verifyFileSignature', () => {
  it('accepts a real PNG declared as image/png', () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    expect(verifyFileSignature(png, 'image/png')).toBe(true);
  });

  it('accepts a real JPEG declared as image/jpeg', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(verifyFileSignature(jpeg, 'image/jpeg')).toBe(true);
  });

  it('accepts a real PDF declared as application/pdf', () => {
    const pdf = Buffer.from('%PDF-1.4\n%...', 'ascii');
    expect(verifyFileSignature(pdf, 'application/pdf')).toBe(true);
  });

  it('accepts a real WebP (RIFF....WEBP) declared as image/webp', () => {
    const webp = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WEBP', 'ascii'),
    ]);
    expect(verifyFileSignature(webp, 'image/webp')).toBe(true);
  });

  // The exact gap this closes: a client can set any Content-Type it wants on the multipart
  // part, so a script/HTML payload could previously ride in labelled as an allowed image type.
  it('rejects an HTML payload mislabelled as image/png', () => {
    const html = Buffer.from(
      '<!doctype html><script>alert(1)</script>',
      'ascii',
    );
    expect(verifyFileSignature(html, 'image/png')).toBe(false);
  });

  it('rejects an HTML payload mislabelled as application/pdf', () => {
    const html = Buffer.from('<html><body>not a pdf</body></html>', 'ascii');
    expect(verifyFileSignature(html, 'application/pdf')).toBe(false);
  });

  it('rejects a PNG-declared file whose bytes are actually a JPEG', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(verifyFileSignature(jpeg, 'image/png')).toBe(false);
  });

  // No signature table entry for this MIME (e.g. most video containers, or SVG's own
  // text/XML body) — falls through to allowed as long as it isn't obviously HTML/script text.
  it('allows a type with no signature entry through when the content is not smuggled markup', () => {
    const mp4ish = Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]); // "ftyp" box
    expect(verifyFileSignature(mp4ish, 'video/mp4')).toBe(true);
  });
});

describe('sanitizeSvg', () => {
  // A compromised/careless admin (or a supply-chain-compromised third-party
  // asset) could upload an SVG carrying an active payload — it must come
  // out inert before it ever reaches storage.
  it('strips <script> elements, on* handlers, and javascript: URIs', () => {
    const payload = '<svg onload="alert(1)"><script>alert(2)</script></svg>';

    const clean = sanitizeSvg(Buffer.from(payload)).toString('utf-8');

    expect(clean).not.toMatch(/onload/i);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/alert\(/i);
  });

  it('strips foreignObject content', () => {
    const payload =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<foreignObject><body xmlns="http://www.w3.org/1999/xhtml">' +
      '<img src=x onerror="alert(3)">' +
      '</body></foreignObject></svg>';

    const clean = sanitizeSvg(Buffer.from(payload)).toString('utf-8');

    expect(clean).not.toMatch(/foreignObject/i);
    expect(clean).not.toMatch(/onerror/i);
    expect(clean).not.toMatch(/alert\(/i);
  });

  it('strips javascript: URIs from href attributes', () => {
    const payload =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<a href="javascript:alert(4)"><rect width="10" height="10"/></a>' +
      '</svg>';

    const clean = sanitizeSvg(Buffer.from(payload)).toString('utf-8');

    expect(clean).not.toMatch(/javascript:/i);
  });

  it('preserves a legitimate transparent-logo SVG', () => {
    const logo =
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">' +
      '<rect width="200" height="80" fill="transparent"/>' +
      '<path d="M10 10 L190 70" stroke="black" stroke-width="2"/>' +
      '</svg>';

    const clean = sanitizeSvg(Buffer.from(logo)).toString('utf-8');

    expect(clean).toContain('<svg');
    expect(clean).toContain('<rect');
    expect(clean).toContain('<path');
    expect(clean).toContain('fill="transparent"');
  });
});

interface CreateMediaArgs {
  data: {
    fileUrl: string;
    fileType: string;
    altText: string;
    width: number | null;
    height: number | null;
  };
}

describe('MediaService.upload', () => {
  let service: MediaService;
  let prisma: {
    media: {
      create: jest.Mock<Promise<{ id: string }>, [CreateMediaArgs]>;
    };
  };
  let storage: {
    upload: jest.Mock<Promise<{ url: string }>, [UploadedFileInput]>;
    delete: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      media: {
        create: jest
          .fn<Promise<{ id: string }>, [CreateMediaArgs]>()
          .mockResolvedValue({ id: 'm1' }),
      },
    };
    storage = {
      upload: jest
        .fn<Promise<{ url: string }>, [UploadedFileInput]>()
        .mockResolvedValue({ url: 'https://cdn.example/logo.svg' }),
      delete: jest.fn(),
    };
    service = new MediaService(prisma as unknown as PrismaService, storage);
  });

  it('sanitizes an SVG payload before handing it to the storage driver', async () => {
    const payload = '<svg onload="alert(1)"><script>alert(2)</script></svg>';

    await service.upload(
      {
        buffer: Buffer.from(payload),
        originalName: 'evil.svg',
        mimeType: 'image/svg+xml',
      },
      'evil logo',
    );

    expect(storage.upload).toHaveBeenCalledTimes(1);
    const uploaded = storage.upload.mock.calls[0][0];
    const uploadedText = uploaded.buffer.toString('utf-8');

    expect(uploadedText).not.toMatch(/onload/i);
    expect(uploadedText).not.toMatch(/<script/i);
    expect(prisma.media.create.mock.calls[0][0].data.fileType).toBe('image');
  });

  it('uploads a legitimate transparent-logo SVG and records its dimensions', async () => {
    const logo =
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">' +
      '<rect width="200" height="80" fill="transparent"/>' +
      '<path d="M10 10 L190 70" stroke="black" stroke-width="2"/>' +
      '</svg>';

    const result = await service.upload(
      {
        buffer: Buffer.from(logo),
        originalName: 'logo.svg',
        mimeType: 'image/svg+xml',
      },
      'company logo',
    );

    expect(result).toEqual({ id: 'm1' });
    const uploaded = storage.upload.mock.calls[0][0];
    const uploadedText = uploaded.buffer.toString('utf-8');
    expect(uploadedText).toContain('<rect');
    expect(uploadedText).toContain('<path');

    expect(prisma.media.create).toHaveBeenCalledWith({
      data: {
        fileUrl: 'https://cdn.example/logo.svg',
        fileType: 'image',
        altText: 'company logo',
        width: 200,
        height: 80,
        sizeBytes: uploadedText.length,
      },
    });
  });
});

function buildDeletionTestService() {
  const prisma = {
    media: {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest
        .fn<
          Promise<unknown>,
          [{ where: unknown; data: Record<string, unknown> }]
        >()
        .mockResolvedValue({}),
      delete: jest
        .fn<Promise<unknown>, [{ where: unknown }]>()
        .mockResolvedValue({}),
    },
  };
  const storage = {
    upload: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const service = new MediaService(prisma as unknown as PrismaService, storage);
  return { service, prisma, storage };
}

describe('MediaService.trash / restore', () => {
  beforeEach(() => {
    mockFindLiveUsage.mockReset();
    mockFindSnapshotUsage.mockReset();
  });

  it('trash() sets deletedAt without touching storage or hard-deleting the row', async () => {
    const { service, prisma, storage } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue({
      id: 'm1',
      fileUrl: 'https://cdn/x.png',
    });

    const result = await service.trash('m1');

    expect(result).toEqual({ trashed: true });
    const [call] = prisma.media.update.mock.calls;
    expect(call[0].where).toEqual({ id: 'm1' });
    expect(call[0].data.deletedAt).toBeInstanceOf(Date);
    expect(prisma.media.delete).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('trash() throws NOT_FOUND for a nonexistent id', async () => {
    const { service, prisma } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue(null);
    await expect(service.trash('missing')).rejects.toThrow();
  });

  it('restore() clears deletedAt without creating a new Media record', async () => {
    const { service, prisma } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue({
      id: 'm1',
      deletedAt: new Date(),
    });

    const result = await service.restore('m1');

    expect(result).toEqual({ restored: true });
    expect(prisma.media.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { deletedAt: null },
    });
  });

  it('restore() is a no-op (not an error) when the item is already active', async () => {
    const { service, prisma } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue({ id: 'm1', deletedAt: null });

    const result = await service.restore('m1');

    expect(result).toEqual({ restored: true });
    expect(prisma.media.update).not.toHaveBeenCalled();
  });
});

describe('MediaService.permanentDelete', () => {
  beforeEach(() => {
    mockFindLiveUsage.mockReset();
    mockFindSnapshotUsage.mockReset();
  });

  it('blocks deletion with MEDIA_IN_VERSION_HISTORY when a published snapshot references it', async () => {
    const { service, prisma, storage } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue({
      id: 'm1',
      fileUrl: 'https://cdn/x.png',
    });
    mockFindSnapshotUsage.mockResolvedValue([
      {
        module: 'Products — Version History',
        contentLabel: 'Copra',
        version: 1,
        publishedAt: new Date(),
      },
    ]);

    let thrown: { code?: string } | undefined;
    try {
      await service.permanentDelete('m1');
    } catch (err) {
      thrown = err as { code?: string };
    }
    expect(thrown?.code).toBe('MEDIA_IN_VERSION_HISTORY');
    expect(storage.delete).not.toHaveBeenCalled();
    expect(prisma.media.delete).not.toHaveBeenCalled();
  });

  it('blocks deletion with MEDIA_IN_USE when a live relation still points to it (P2003)', async () => {
    const { service, prisma, storage } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue({
      id: 'm1',
      fileUrl: 'https://cdn/x.png',
    });
    mockFindSnapshotUsage.mockResolvedValue([]);
    prisma.media.delete.mockRejectedValue({ code: 'P2003' });

    let thrown: { code?: string } | undefined;
    try {
      await service.permanentDelete('m1');
    } catch (err) {
      thrown = err as { code?: string };
    }
    expect(thrown?.code).toBe('MEDIA_IN_USE');
    // Storage was already deleted before the DB constraint fired — documented, accepted
    // trade-off (an orphaned file is safer than an orphaned DB row); this asserts that
    // ordering actually happens, not that it's harmless.
    expect(storage.delete).toHaveBeenCalledWith('https://cdn/x.png');
  });

  it('deletes storage then the DB row when there are no references at all', async () => {
    const { service, prisma, storage } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue({
      id: 'm1',
      fileUrl: 'https://cdn/x.png',
    });
    mockFindSnapshotUsage.mockResolvedValue([]);

    const result = await service.permanentDelete('m1');

    expect(result).toEqual({ deleted: true });
    expect(storage.delete).toHaveBeenCalledWith('https://cdn/x.png');
    expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
  });

  it('does NOT delete the DB row when storage deletion fails', async () => {
    const { service, prisma, storage } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue({
      id: 'm1',
      fileUrl: 'https://cdn/x.png',
    });
    mockFindSnapshotUsage.mockResolvedValue([]);
    storage.delete.mockRejectedValue(new Error('network error'));

    let thrown: { code?: string } | undefined;
    try {
      await service.permanentDelete('m1');
    } catch (err) {
      thrown = err as { code?: string };
    }
    expect(thrown?.code).toBe('MEDIA_STORAGE_DELETE_FAILED');
    expect(prisma.media.delete).not.toHaveBeenCalled();
  });
});

describe('MediaService.getUsage', () => {
  it('combines live and version-history references without querying either eagerly elsewhere', async () => {
    const { service, prisma } = buildDeletionTestService();
    prisma.media.findUnique.mockResolvedValue({ id: 'm1' });
    mockFindLiveUsage.mockResolvedValue([
      { module: 'Products', label: 'Copra — Cover' },
    ]);
    mockFindSnapshotUsage.mockResolvedValue([
      {
        module: 'Products — Version History',
        contentLabel: 'Copra',
        version: 1,
        publishedAt: new Date('2026-01-01'),
      },
    ]);

    const usage = await service.getUsage('m1');

    expect(usage.live).toEqual([
      { module: 'Products', label: 'Copra — Cover' },
    ]);
    expect(usage.version_history).toEqual([
      {
        module: 'Products — Version History',
        content_label: 'Copra',
        version: 1,
        published_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });
});
