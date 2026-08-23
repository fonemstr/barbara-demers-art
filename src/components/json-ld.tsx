// Renders a Schema.org JSON-LD block. Per the Next.js JSON-LD guide, `<` is
// escaped so CMS-entered text can never break out of the script tag.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
