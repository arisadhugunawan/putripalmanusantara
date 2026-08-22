import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

// pdfjs-dist ships ESM-only (.mjs); this module compiles to CommonJS, so it
// must be loaded via dynamic import() rather than a static import.
const STANDARD_FONT_DATA_URL = `${join(
  dirname(require.resolve('pdfjs-dist/package.json')),
  'standard_fonts',
)}/`;

/**
 * pdfjs-dist builds glyph outlines with the browser's native `Path2D`, and
 * `canvas` (node-canvas) has no `Path2D` of its own — without a polyfill,
 * rendering completes with no error but every character is silently
 * skipped, leaving only the page background. `path2d-polyfill`'s bundle
 * patches `window.CanvasRenderingContext2D.prototype` in place, so it's
 * loaded and applied once per process.
 */
let path2dPolyfillReady: Promise<void> | null = null;

function findPackageDir(packageName: string): string {
  for (const candidate of require.resolve.paths(packageName) ?? []) {
    const dir = join(candidate, packageName);
    if (existsSync(dir)) return dir;
  }
  throw new Error(`Could not locate installed package "${packageName}".`);
}

async function ensurePath2DPolyfill(): Promise<void> {
  path2dPolyfillReady ??= (async () => {
    const g = globalThis as unknown as Record<string, unknown>;
    g.window ??= globalThis;
    g.self ??= globalThis;
    g.CanvasRenderingContext2D ??= CanvasRenderingContext2D;
    g.requestAnimationFrame ??= (cb: (time: number) => void) =>
      setTimeout(() => cb(Date.now()), 0);

    const distPath = join(
      findPackageDir('path2d-polyfill'),
      'dist/path2d-polyfill.min.js',
    );
    await import(distPath);
  })();
  return path2dPolyfillReady;
}

/** Auxiliary-canvas factory backed by `canvas`, so pdf.js never falls back
 * to its own default (which requires the unrelated `@napi-rs/canvas`).
 * pdf.js instantiates this itself (`new options.CanvasFactory(...)`), so the
 * class — not an instance — must be passed to `getDocument()`. */
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext('2d') };
  }
  reset(
    canvasAndContext: { canvas: { width: number; height: number } },
    width: number,
    height: number,
  ) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext: {
    canvas: { width: number; height: number } | null;
    context: unknown;
  }) {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    }
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

/** Renders page 1 of a PDF to a PNG buffer, scaled to `targetWidth` px wide. */
export async function renderPdfFirstPageToPng(
  pdfBytes: Uint8Array,
  targetWidth = 900,
): Promise<Buffer> {
  await ensurePath2DPolyfill();

  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = getDocument({
    data: pdfBytes,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    disableFontFace: true,
    CanvasFactory: NodeCanvasFactory,
  });

  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(
      Math.round(viewport.width),
      Math.round(viewport.height),
    );
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context as never,
      canvas: null,
      viewport,
    }).promise;

    return canvas.toBuffer('image/png');
  } finally {
    await loadingTask.destroy();
  }
}
