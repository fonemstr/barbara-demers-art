import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { getPayloadClient } from "@/lib/payload";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover?: string;
  content: string; // MDX source or serialized rich text string
  isRichText?: boolean;
  richTextDoc?: unknown;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

async function readDir(): Promise<string[]> {
  try {
    return await fs.readdir(BLOG_DIR);
  } catch {
    return [];
  }
}

async function getFilePosts(): Promise<BlogPost[]> {
  const files = await readDir();
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf8");
        const { data, content } = matter(raw);
        return {
          slug: file.replace(/\.mdx$/, ""),
          title: data.title ?? file,
          date: data.date
            ? new Date(data.date).toISOString()
            : new Date().toISOString(),
          excerpt: data.excerpt ?? "",
          cover: data.cover,
          content,
        } satisfies BlogPost;
      }),
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

type PayloadJournalPost = {
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt?: string;
  updatedAt: string;
  status: "draft" | "published";
  cover?: { url?: string } | string | null;
  body?: unknown;
};

function mapPayloadPost(doc: PayloadJournalPost): BlogPost {
  const coverUrl =
    doc.cover && typeof doc.cover !== "string"
      ? doc.cover.url
      : undefined;

  return {
    slug: doc.slug,
    title: doc.title,
    date: doc.publishedAt ?? doc.updatedAt,
    excerpt: doc.excerpt ?? "",
    cover: coverUrl,
    content: "",
    isRichText: true,
    richTextDoc: doc.body,
  };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const payload = await getPayloadClient();
  if (!payload) return getFilePosts();

  try {
    const result = await payload.find({
      collection: "journal-posts",
      depth: 2,
      limit: 200,
      sort: "-publishedAt",
      where: { status: { equals: "published" } },
    });
    const docs = result.docs as unknown as PayloadJournalPost[];
    if (docs.length === 0) return getFilePosts();
    return docs.map(mapPayloadPost);
  } catch (err) {
    console.error("[blog] Payload query failed, using MDX files:", err);
    return getFilePosts();
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
