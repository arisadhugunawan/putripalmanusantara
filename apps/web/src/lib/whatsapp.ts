/** wa.me click-to-chat link — docs/06-architecture.md §11 (direct link, not an API integration). */
export function whatsAppLink(rawNumber: string, message?: string): string {
  const digitsOnly = rawNumber.replace(/[^\d]/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digitsOnly}${query}`;
}

interface WhatsAppMessageSettings {
  whatsapp_message_greeting: string;
  whatsapp_message_intro: string;
  whatsapp_message_product_list_label: string;
  whatsapp_message_closing: string;
}

/**
 * Builds the Contact page's default WhatsApp message from four Admin-editable parts (Greeting/
 * Message/Product list label/Closing — see the Contact Page CMS) plus the real, live product
 * catalog, which is always composed at render time rather than stored as a fourth field — the
 * product names shown here can never drift from what the site actually sells. Replaces what
 * used to be a hardcoded i18n dictionary string.
 */
export function buildWhatsAppMessage(
  settings: WhatsAppMessageSettings,
  productNames: string[],
): string {
  const productLines = productNames.map((name) => `- ${name}`).join("\n");
  return [
    settings.whatsapp_message_greeting,
    settings.whatsapp_message_intro,
    `${settings.whatsapp_message_product_list_label}\n${productLines}`,
    settings.whatsapp_message_closing,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Per-product variant (reached via a Product page's "WhatsApp" CTA, `?product=` slug) — reuses
 * the same Admin-configured greeting/closing so an Admin edit to either still applies here,
 * with the single product name substituted in place of the full catalog list. `messageTemplate`
 * is the locale-resolved middle sentence (`dictionary.contact.whatsappProductMessageTemplate`,
 * see `[locale]/contact/page.tsx`) — same `{product}`-placeholder convention already used by
 * `ProductQuickActions.tsx`'s `whatsappMessageTemplate`, so both per-product WhatsApp messages
 * in this codebase share one interpolation pattern. */
export function buildWhatsAppProductMessage(
  settings: WhatsAppMessageSettings,
  productName: string,
  messageTemplate: string,
): string {
  return [
    settings.whatsapp_message_greeting,
    messageTemplate.replace("{product}", productName),
    settings.whatsapp_message_closing,
  ]
    .filter(Boolean)
    .join("\n\n");
}
