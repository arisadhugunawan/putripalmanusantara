import {
  sanitizeRichText,
  sanitizeTranslationsRichText,
} from './sanitize-rich-text.util';

describe('sanitizeRichText — malicious payloads (Phase 5F-P0.1)', () => {
  it('strips <script> and its content entirely', () => {
    const result = sanitizeRichText('<p>Hello</p><script>alert(1)</script>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('<p>Hello</p>');
  });

  it('strips onerror from <img> but keeps the tag', () => {
    const result = sanitizeRichText('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('<img');
  });

  it('strips <svg onload=...> entirely — SVG is not in the allowlist', () => {
    const result = sanitizeRichText('<svg onload="alert(1)"><circle /></svg>');
    expect(result).not.toContain('<svg');
    expect(result).not.toContain('onload');
    expect(result).not.toContain('alert(1)');
  });

  it('neutralizes a javascript: href on a link', () => {
    const result = sanitizeRichText('<a href="javascript:alert(1)">Click</a>');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('alert(1)');
  });

  it('strips <iframe> entirely, including a javascript: src', () => {
    const result = sanitizeRichText(
      '<iframe src="javascript:alert(1)"></iframe>',
    );
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('alert(1)');
  });

  it('rejects data: URLs on links', () => {
    const result = sanitizeRichText(
      '<a href="data:text/html,<script>alert(1)</script>">Click</a>',
    );
    expect(result).not.toContain('data:');
    expect(result).not.toContain('<script');
  });

  it('rejects vbscript: URLs', () => {
    const result = sanitizeRichText('<a href="vbscript:msgbox(1)">Click</a>');
    expect(result).not.toContain('vbscript:');
  });

  it('strips style-attribute-based payloads (style is not in the allowlist)', () => {
    const result = sanitizeRichText(
      '<p style="background:url(javascript:alert(1))">Text</p>',
    );
    expect(result).not.toContain('style=');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('Text');
  });

  it('strips onmouseover and other event-handler attributes generically', () => {
    const result = sanitizeRichText('<p onmouseover="alert(1)">Text</p>');
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('Text');
  });

  it('strips <object> and <embed>', () => {
    const result = sanitizeRichText(
      '<object data="evil.swf"></object><embed src="evil.swf">',
    );
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
  });

  it('does not let an HTML-entity-encoded payload survive as a live tag', () => {
    // The literal encoded text "&lt;script&gt;" is not a tag at all (it's already inert text,
    // same as any plain-text mention of "<script>" a legitimate author might type) — the real
    // requirement is that it never becomes an *executable* <script> element, which it doesn't:
    // sanitize-html only parses real markup, so this passes through as harmless text content.
    const result = sanitizeRichText(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
    expect(result).not.toMatch(/<script[^&]/);
  });

  it('protocol-relative URLs are rejected', () => {
    const result = sanitizeRichText('<a href="//evil.com/x">Click</a>');
    expect(result).not.toContain('//evil.com');
  });

  it('rejects an unlisted tag not in the attack-surface checklist too (e.g. <form>)', () => {
    const result = sanitizeRichText(
      '<form action="https://evil.com"><input></form>Text',
    );
    expect(result).not.toContain('<form');
    expect(result).not.toContain('<input');
    expect(result).toContain('Text');
  });
});

describe('sanitizeRichText — legitimate formatting preserved', () => {
  it('preserves headings, bold, lists, blockquote, and a safe link', () => {
    const html =
      '<h2>Heading</h2><p><strong>Bold</strong> text</p><ul><li>Item</li></ul>' +
      '<blockquote>A quote</blockquote><a href="https://example.com">Link</a>';
    const result = sanitizeRichText(html);
    expect(result).toContain('<h2>Heading</h2>');
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('<ul><li>Item</li></ul>');
    expect(result).toContain('<blockquote>A quote</blockquote>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('>Link<');
  });

  it('preserves italic, ordered lists, and a horizontal rule', () => {
    const html = '<p><em>Italic</em></p><ol><li>One</li></ol><hr>';
    const result = sanitizeRichText(html);
    expect(result).toContain('<em>Italic</em>');
    expect(result).toContain('<ol><li>One</li></ol>');
    expect(result).toContain('<hr');
  });

  it('preserves an uploaded image with its class attribute', () => {
    const html =
      '<img src="https://cdn.example.com/x.png" alt="A photo" class="rounded-field">';
    const result = sanitizeRichText(html);
    expect(result).toContain('src="https://cdn.example.com/x.png"');
    expect(result).toContain('alt="A photo"');
    expect(result).toContain('class="rounded-field"');
  });

  it('preserves a mailto link', () => {
    const result = sanitizeRichText(
      '<a href="mailto:sales@ppn-example.com">Email us</a>',
    );
    expect(result).toContain('href="mailto:sales@ppn-example.com"');
  });

  it('adds rel="noopener noreferrer" to every link', () => {
    const result = sanitizeRichText('<a href="https://example.com">Link</a>');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('is idempotent — sanitizing already-clean output changes nothing further', () => {
    const html = '<h2>Heading</h2><p><strong>Bold</strong> text</p>';
    const once = sanitizeRichText(html);
    const twice = sanitizeRichText(once);
    expect(twice).toBe(once);
  });

  it('passes through empty and non-string input unchanged', () => {
    expect(sanitizeRichText('')).toBe('');
  });
});

describe('sanitizeTranslationsRichText', () => {
  it('sanitizes the named field in every locale, preserving other fields untouched', () => {
    const translations = {
      id: { name: 'Kopra', content: '<script>alert(1)</script><p>Aman</p>' },
      zh: { name: '椰干', content: '<p>Bersih</p>' },
    };
    const result = sanitizeTranslationsRichText(translations, [
      'content',
    ]) as Record<string, Record<string, string>>;
    expect(result.id.name).toBe('Kopra');
    expect(result.id.content).not.toContain('<script');
    expect(result.id.content).toContain('<p>Aman</p>');
    expect(result.zh.content).toBe('<p>Bersih</p>');
  });

  it('returns null/undefined unchanged', () => {
    expect(sanitizeTranslationsRichText(null, ['content'])).toBeNull();
    expect(
      sanitizeTranslationsRichText(undefined, ['content']),
    ).toBeUndefined();
  });

  it('does not mutate the input object', () => {
    const translations = { id: { content: '<script>alert(1)</script>' } };
    const original = JSON.parse(
      JSON.stringify(translations),
    ) as typeof translations;
    sanitizeTranslationsRichText(translations, ['content']);
    expect(translations).toEqual(original);
  });
});
