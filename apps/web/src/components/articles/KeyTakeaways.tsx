/** Brief item 18 — optional editorial callout, Admin-controlled (`Article.key_takeaways`). */
export function KeyTakeaways({
  items,
  label = "Key Takeaways",
}: {
  items: string[];
  label?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="my-10 rounded-card border-l-4 border-primary-500 bg-primary-50 p-6 sm:p-8">
      <p className="text-small font-semibold uppercase tracking-wide text-primary-700">{label}</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 text-body text-neutral-800">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
