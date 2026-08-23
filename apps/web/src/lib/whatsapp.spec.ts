/**
 * Focused regression tests for the Contact page's per-product WhatsApp message localization
 * (Phase P0.3-B3-D2). `apps/web` has no test runner configured (no jest/vitest config anywhere
 * in this workspace) — this file deliberately uses only Node's built-in `node:test` +
 * `node:assert/strict`, run via `npx tsx --test src/lib/whatsapp.spec.ts` from `apps/web`. No
 * new dependency, no new config file, nothing wired into a package.json script; this is a
 * documented limitation, not an oversight — see the phase report.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppMessage, buildWhatsAppProductMessage, whatsAppLink } from "./whatsapp";
import en from "../i18n/dictionaries/en";
import id from "../i18n/dictionaries/id";
import zh from "../i18n/dictionaries/zh";
import th from "../i18n/dictionaries/th";
import hi from "../i18n/dictionaries/hi";
import vi from "../i18n/dictionaries/vi";

const SETTINGS = {
  whatsapp_message_greeting: "Hello PPN Team,",
  whatsapp_message_intro: "unused for the per-product variant",
  whatsapp_message_product_list_label: "unused for the per-product variant",
  whatsapp_message_closing: "Thank you.",
};

const DICTIONARIES = { en, id, zh, th, hi, vi } as const;

for (const [locale, dictionary] of Object.entries(DICTIONARIES)) {
  test(`${locale} locale produces a message using the ${locale} template`, () => {
    const message = buildWhatsAppProductMessage(
      SETTINGS,
      "Semi Husked Coconut",
      dictionary.contact.whatsappProductMessageTemplate,
    );
    const expectedSentence = dictionary.contact.whatsappProductMessageTemplate.replace(
      "{product}",
      "Semi Husked Coconut",
    );
    assert.ok(
      message.includes(expectedSentence),
      `${locale} message should contain the localized sentence with the product name substituted`,
    );
    assert.ok(message.includes(SETTINGS.whatsapp_message_greeting));
    assert.ok(message.includes(SETTINGS.whatsapp_message_closing));
  });
}

test("product name is correctly substituted into {product}, not left as a literal placeholder", () => {
  const message = buildWhatsAppProductMessage(SETTINGS, "Copra", en.contact.whatsappProductMessageTemplate);
  assert.ok(message.includes("Copra"));
  assert.ok(!message.includes("{product}"));
});

test("a product name containing spaces and special characters is preserved verbatim in the message and correctly percent-encoded in the WhatsApp URL", () => {
  const productName = "Coconut Shell Charcoal (Grade A) & Co.";
  const message = buildWhatsAppProductMessage(SETTINGS, productName, en.contact.whatsappProductMessageTemplate);
  assert.ok(message.includes(productName));

  const link = whatsAppLink("6282293807717", message);
  const url = new URL(link);
  assert.equal(url.searchParams.get("text"), message);
  assert.ok(link.startsWith("https://wa.me/6282293807717?text="));
  // encodeURIComponent must escape the space/parens/ampersand rather than leaving them raw or
  // double-encoding an already-encoded string.
  assert.ok(!link.includes(" "));
  assert.ok(link.includes(encodeURIComponent(productName)));
  assert.ok(!link.includes("%2520"), "must not double-encode");
});

test("whatsAppLink strips non-digit characters from the phone number and keeps the standard wa.me structure", () => {
  const link = whatsAppLink("+62 822-9380-7717", "hello");
  assert.equal(link, "https://wa.me/6282293807717?text=hello");
});

test("no hardcoded English sentence remains in buildWhatsAppProductMessage's own source", () => {
  // A regression guard against re-introducing the old inline English string — asserts the
  // function is now purely a function of its `messageTemplate` argument: two different
  // templates for the same product must produce two different messages.
  const en_msg = buildWhatsAppProductMessage(SETTINGS, "Copra", "EN template: {product}");
  const id_msg = buildWhatsAppProductMessage(SETTINGS, "Copra", "ID template: {product}");
  assert.notEqual(en_msg, id_msg);
  assert.ok(en_msg.includes("EN template: Copra"));
  assert.ok(id_msg.includes("ID template: Copra"));
});

test("every locale dictionary's whatsappProductMessageTemplate contains the {product} placeholder", () => {
  for (const [locale, dictionary] of Object.entries(DICTIONARIES)) {
    assert.ok(
      dictionary.contact.whatsappProductMessageTemplate.includes("{product}"),
      `${locale} template is missing the {product} placeholder`,
    );
  }
});

test("buildWhatsAppMessage (the general, non-product variant) is unaffected by this change", () => {
  // ProductQuickActions.tsx's own whatsappMessageTemplate prop and buildWhatsAppMessage() are
  // untouched by this phase — this is a smoke check that the sibling function signature/behavior
  // didn't shift as a side effect.
  const message = buildWhatsAppMessage(SETTINGS, ["Copra", "Coconut Shell Charcoal"]);
  assert.ok(message.includes("- Copra"));
  assert.ok(message.includes("- Coconut Shell Charcoal"));
});
