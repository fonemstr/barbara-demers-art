import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost } from "@/lib/blog";
import { LexicalRichText } from "@/components/rich-text";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Blob } from "@/components/ui/blob";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const all = await getAllPosts();
  const more = all.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <Section tone="surface" pad="md" maxWidth="3xl" className="overflow-hidden">
        <Blob size={300} color="var(--surface-variant)" style={{ right: -120, top: -30, opacity: 0.6 }} />
        <Link
          href="/blog"
          className="relative z-[2] inline-flex items-center gap-1.5 text-sm text-on-surface-muted hover:text-on-surface mb-10"
        >
          <span aria-hidden>←</span> All letters
        </Link>

        <header className="relative z-[2]">
          <Eyebrow>{formatDate(post.date)}</Eyebrow>
          <h1 className="mt-4 font-serif text-4xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-balance">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-6 text-xl text-on-surface-muted leading-relaxed text-pretty">
              {post.excerpt}
            </p>
          )}
        </header>

        {post.cover && (
          <div className="relative mt-12 aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)] shadow-ambient-lg">
            <Image
              src={post.cover}
              alt=""
              fill
              sizes="(min-width: 768px) 64rem, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}
      </Section>

      <Section tone="surface" pad="md" maxWidth="3xl">
        <article>
          {post.isRichText ? (
            <LexicalRichText doc={post.richTextDoc} />
          ) : (
            <div className="rich-text">
              <MDXRemote source={post.content} />
            </div>
          )}
        </article>

        <hr className="my-16 border-0 h-px bg-outline-variant" />

        <p className="font-serif italic text-lg text-on-surface-muted text-balance">
          — Barbara, from the studio
        </p>
      </Section>

      {/* More from the journal */}
      {more.length > 0 && (
        <Section tone="low" pad="lg">
          <Eyebrow>More from the journal</Eyebrow>
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {more.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block rounded-[var(--radius-lg)] bg-surface-container-lowest p-7 hover:bg-surface-container transition-colors"
                >
                  <p className="text-[12px] uppercase tracking-[0.2em] text-on-surface-subtle">
                    {formatDate(p.date)}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl leading-tight text-on-surface group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-2 text-[15px] text-on-surface-muted leading-relaxed">
                      {p.excerpt}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
