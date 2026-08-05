/**
 * Renders a JSON-LD <script> tag. Escapes "</" so a string value can never prematurely
 * close the script element (the standard XSS-safety measure for inline JSON-LD).
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
