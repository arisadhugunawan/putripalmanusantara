/** wa.me click-to-chat link — docs/06-architecture.md §11 (direct link, not an API integration). */
export function whatsAppLink(rawNumber: string, message?: string): string {
  const digitsOnly = rawNumber.replace(/[^\d]/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digitsOnly}${query}`;
}
