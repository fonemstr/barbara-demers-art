import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata = { title: "Journal" };

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Journal
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">Notes from the studio</h1>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <ul className="space-y-10">
          {posts.map((post) => (
            <li key={post.slug} className="border-b border-border pb-10">
              <time className="text-xs uppercase tracking-widest text-muted-foreground">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="font-serif text-2xl md:text-3xl mt-2">
                <Link href={`/blog/${post.slug}`} className="hover:underline underline-offset-4">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-sm underline underline-offset-4"
              >
                Read
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
