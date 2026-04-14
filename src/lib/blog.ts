import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover?: string;
  content: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

async function readDir(): Promise<string[]> {
  try {
    return await fs.readdir(BLOG_DIR);
  } catch {
    return [];
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
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
          date: data.date ?? new Date().toISOString(),
          excerpt: data.excerpt ?? "",
          cover: data.cover,
          content,
        } satisfies BlogPost;
      }),
  );

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
