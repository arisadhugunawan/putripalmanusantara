import { buttonVariants } from "@ppn/ui-components";

/** Real address only — this section doesn't render at all when no address is on file
 * (see contact/page.tsx), never a map centered on a fabricated location. */
export function ContactMap({ address }: { address: string }) {
  const query = encodeURIComponent(address);
  return (
    <div>
      <div className="aspect-4/3 overflow-hidden rounded-card border border-neutral-200 shadow-card sm:aspect-16/9">
        <iframe
          title="Office location map"
          src={`https://www.google.com/maps?q=${query}&output=embed`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-4 inline-flex ${buttonVariants("secondary", "sm")}`}
      >
        View on Google Maps
      </a>
    </div>
  );
}
