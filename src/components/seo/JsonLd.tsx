/**
 * Emits a JSON-LD block. The payload is serialised server-side and never
 * contains user-controlled HTML, but `<` is still escaped so a stray sequence
 * in a listing title cannot close the script tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
