import sanitizeHtml from 'sanitize-html';

/**
 * Phase 5F-P0.1 — stored-XSS hardening for admin rich-text content (Article.content,
 * AboutCompanyProfile.mainDescription/companyOverview, and their per-locale translations).
 *
 * The allowlist matches exactly what the admin's TipTap editor
 * (apps/web/src/components/admin/RichTextEditor.tsx — `StarterKit` + `@tiptap/extension-image`,
 * nothing else) can actually produce — nothing broader. StarterKit v3 bundles: Paragraph,
 * HardBreak, Bold, Italic, Strike, Code, CodeBlock, Heading (h1-h6), BulletList/OrderedList/
 * ListItem, Blockquote, HorizontalRule, and Link. The Image extension adds `<img>`. Underline is
 * NOT imported by this editor, so `<u>` is deliberately not allowed — allowing a tag the editor
 * can never produce would only widen the attack surface for zero formatting benefit.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  's',
  'strike',
  'del',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'a',
  'img',
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  // `rel` is force-set by transformTags below (never trusts a caller-supplied value); allowing
  // it here just lets sanitize-html keep the value our own transform writes.
  a: ['href', 'target', 'rel'],
  // `class` is kept because RichTextEditor.tsx configures the Image extension with
  // `HTMLAttributes: { class: "rounded-field" }` — dropping it would silently lose that styling
  // on every image already saved through the editor.
  img: ['src', 'alt', 'width', 'height', 'class'],
};

/**
 * Sanitizes a single rich-text HTML string. Strips every tag/attribute not in the allowlist
 * above (script, iframe, object, embed, svg, style, form, and all `on*` event-handler
 * attributes — the allowlist is closed, so nothing needs a separate event-handler blocklist),
 * and restricts `href`/`src` to http/https (plus mailto for links only, since the editor's own
 * "Tautan" button has no scheme restriction and a plain `mailto:` link is a legitimate,
 * non-executable use case for article content). `javascript:`, `data:`, `vbscript:`, and
 * protocol-relative URLs are all rejected.
 */
export function sanitizeRichText(html: string): string {
  if (typeof html !== 'string' || html.length === 0) return html;
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    nonTextTags: [
      'script',
      'style',
      'textarea',
      'option',
      'noscript',
      'iframe',
      'object',
      'embed',
      'svg',
    ],
    // Every link gets a safe `rel` regardless of `target` — cheaper and more robust than only
    // adding it when `target="_blank"` is present, and matches this being attacker-controlled
    // input (an editor could otherwise set target="_blank" with no rel via raw HTML paste).
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        'a',
        { rel: 'noopener noreferrer' },
        true,
      ),
    },
  });
}

/**
 * Sanitizes one rich-text field inside every locale of a `translations` JSON blob, in place —
 * returns a new object (never mutates the input). `translate()` (common/utils/i18n.util.ts)
 * swaps a locale's translated value in for the English base field with no sanitization step of
 * its own, so a per-locale rich-text override needs exactly the same treatment as the base field
 * or it becomes a bypass (e.g. a malicious payload saved only under `translations.zh.content`
 * would never pass through the base-field sanitizer at all).
 */
export function sanitizeTranslationsRichText(
  translations: unknown,
  fields: readonly string[],
): typeof translations {
  if (!translations || typeof translations !== 'object') return translations;
  const result: Record<string, unknown> = {
    ...(translations as Record<string, unknown>),
  };
  for (const [locale, block] of Object.entries(
    translations as Record<string, unknown>,
  )) {
    if (!block || typeof block !== 'object') continue;
    const newBlock: Record<string, unknown> = {
      ...(block as Record<string, unknown>),
    };
    let changed = false;
    for (const field of fields) {
      const value = newBlock[field];
      if (typeof value === 'string') {
        newBlock[field] = sanitizeRichText(value);
        changed = true;
      }
    }
    if (changed) result[locale] = newBlock;
  }
  return result;
}
