import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Blob } from "@/components/ui/blob";
import { JsonLd } from "@/components/json-ld";
import { collectionGraph } from "@/lib/schema";

export const metadata = {
  title: "Studio Journal",
  description:
    "Notes from Barbara J Demers's painting studio: the stories behind new animal paintings, works in progress, Budderlee arrivals, and commission spotlights.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 60;

function readingMinutes(text: string): number {
  const words = (text || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  const [lead, ...rest] = posts;

  return (
    <>
      <JsonLd
        data={collectionGraph({
          path: "/blog",
          name: "Studio Journal",
          description: metadata.description,
          itemPaths: posts.map((p) => `/blog/${p.slug}`),
        })}
      />
      <Section tone="surface" pad="md" className="overflow-hidden">
        <Blob size={360} color="var(--secondary-container)" style={{ left: -80, top: -40, opacity: 0.45 }} />
        <div className="relative z-10">
          <PageHeader
            eyebrow="Notes from the studio"
            title={
              <>
                Things I&rsquo;ve been
                <br /> thinking about, painting.
              </>
            }
            lede="Letters from the easel — what I&rsquo;m working on, what I&rsquo;m learning, the occasional progress photo. First-person, no SEO blog filler."
          />
        </div>
      </Section>

      {posts.length === 0 ? (
        <Section tone="low" pad="lg">
          <p className="text-on-surface-muted text-center">
            No letters yet. Subscribe on the home page and you&rsquo;ll get
            the first one in your inbox.
          </p>
        </Section>
      ) : (
        <>
          {/* Lead post — full bleed feature */}
          {lead && (
            <Section tone="surface" pad="md">
              <Link
                href={`/blog/${lead.slug}`}
                className="group grid gap-10 md:grid-cols-[1.1fr_1fr] items-center"
              >
                <div className="relative aspect-[4/5] md:aspect-[5/6] overflow-hidden bg-surface-container">
                  <Image
                    src={lead.cover ?? "/paintings/placeholder-1.svg"}
                    alt={lead.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.02]"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-on-surface-subtle">
                    {formatDate(lead.date)} · {readingMinutes(lead.excerpt + (lead.content ?? ""))} min read
                  </p>
                  <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-[1.05] tracking-[-0.015em] text-balance">
                    {lead.title}
                  </h2>
                  {lead.excerpt && (
                    <p className="mt-5 text-lg text-on-surface-muted leading-relaxed text-pretty">
                      {lead.excerpt}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-2 font-medium text-primary group-hover:gap-3 transition-all">
                    Read the letter <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            </Section>
          )}

          {/* Rest of posts — alternating tonal rows, no dividers */}
          {rest.length > 0 && (
            <Section tone="low" pad="lg">
              <ul className="flex flex-col gap-2">
                {rest.map((post, i) => (
                  <li
                    key={post.slug}
                    className={`rounded-[var(--radius-lg)] transition-colors hover:bg-surface-container ${
                      i % 2 === 0 ? "bg-surface-container-low" : "bg-transparent"
                    }`}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group grid grid-cols-1 md:grid-cols-[140px_1fr_auto] items-baseline gap-6 p-6"
                    >
                      <time className="text-[13px] uppercase tracking-[0.18em] text-on-surface-subtle tabular-nums">
                        {formatDate(post.date)}
                      </time>
                      <div>
                        <h3 className="font-serif text-2xl md:text-3xl leading-tight text-on-surface group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 text-on-surface-muted leading-relaxed text-pretty">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-on-surface-subtle whitespace-nowrap">
                        {readingMinutes(post.excerpt + (post.content ?? ""))} min
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </>
  );
}
