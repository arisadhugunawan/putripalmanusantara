import { createCanvas, loadImage } from 'canvas';
import { capImageDimensions } from './image-resize.util';

function makePng(width: number, height: number): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3f6b4c';
  ctx.fillRect(0, 0, width, height);
  return canvas.toBuffer('image/png');
}

describe('capImageDimensions', () => {
  it('returns the original buffer unchanged when already within the cap', async () => {
    const original = makePng(400, 300);
    const result = await capImageDimensions(original, 'image/png', 2560, 2560);
    expect(result).toBe(original); // same reference — no re-encode happened at all
  });

  it('downscales an oversized PNG to fit within maxWidth/maxHeight, preserving aspect ratio', async () => {
    const original = makePng(4000, 2000); // 2:1
    const result = await capImageDimensions(original, 'image/png', 2000, 2000);

    expect(result).not.toBe(original);
    const resized = await loadImage(result);
    expect(resized.width).toBeLessThanOrEqual(2000);
    expect(resized.height).toBeLessThanOrEqual(2000);
    expect(resized.width).toBe(2000); // the binding dimension for a 2:1 image capped at 2000×2000
    expect(resized.height).toBe(1000);
  });

  it('re-encodes a resized JPEG back as JPEG, not PNG', async () => {
    const canvas = createCanvas(4000, 3000);
    canvas.getContext('2d').fillRect(0, 0, 4000, 3000);
    const original = canvas.toBuffer('image/jpeg');

    const result = await capImageDimensions(original, 'image/jpeg', 2000, 2000);

    expect(result).not.toBe(original);
    // JPEG SOI marker — confirms the output is really JPEG-encoded, not silently PNG.
    expect(result[0]).toBe(0xff);
    expect(result[1]).toBe(0xd8);
  });

  it('never touches GIF, to avoid destroying animation (single-frame canvas capture)', async () => {
    const original = Buffer.from(
      'GIF89a-not-a-real-gif-but-that-is-fine-for-this-test',
    );
    const result = await capImageDimensions(original, 'image/gif', 100, 100);
    expect(result).toBe(original);
  });

  it('never touches WebP, to avoid a format/extension mismatch on re-encode', async () => {
    const original = makePng(4000, 4000); // content doesn't matter — mimeType alone must short-circuit
    const result = await capImageDimensions(original, 'image/webp', 100, 100);
    expect(result).toBe(original);
  });

  it('falls back to the original buffer if the policy has no cap configured (0×0)', async () => {
    const original = makePng(4000, 4000);
    const result = await capImageDimensions(original, 'image/png', 0, 0);
    expect(result).toBe(original);
  });

  it('is best-effort: an undecodable buffer falls back to the original rather than throwing', async () => {
    const garbage = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]); // PNG magic bytes, corrupt body
    await expect(
      capImageDimensions(garbage, 'image/png', 100, 100),
    ).resolves.toBe(garbage);
  });
});
