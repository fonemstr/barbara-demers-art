import React from "react";
import { cn } from "@/lib/utils";

// Minimal Lexical -> React renderer for the fields we use. Covers
// paragraphs, headings, lists, links, and basic text formatting — enough
// for a studio journal. Expand as Barbara's posts get fancier.
type LexicalNode = {
  type?: string;
  tag?: string;
  text?: string;
  format?: number;
  url?: string;
  children?: LexicalNode[];
  version?: number;
};

type LexicalDoc = { root: LexicalNode };

function renderInline(node: LexicalNode, key: number): React.ReactNode {
  if (node.type === "text") {
    const format = node.format ?? 0;
    let out: React.ReactNode = node.text ?? "";
    if (format & 1) out = <strong key={key}>{out}</strong>;
    if (format & 2) out = <em key={key}>{out}</em>;
    if (format & 8) out = <u key={key}>{out}</u>;
    if (format & 16) out = <code key={key}>{out}</code>;
    return out;
  }

  if (node.type === "link") {
    return (
      <a key={key} href={node.url} className="text-primary underline underline-offset-[4px] decoration-1 decoration-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] hover:decoration-[color:var(--primary)]">
        {(node.children ?? []).map(renderInline)}
      </a>
    );
  }

  if (node.type === "linebreak") {
    return <br key={key} />;
  }

  return (node.children ?? []).map(renderInline);
}

function renderBlock(node: LexicalNode, key: number, index: number, isFirstParagraph: boolean): React.ReactNode {
  const children = node.children ?? [];
  switch (node.type) {
    case "paragraph":
      return (
        <p
          key={key}
          className={cn(
            "text-[18px] leading-[1.7] text-on-surface-muted mt-6",
            // First paragraph gets a serif drop-cap
            isFirstParagraph && "first-paragraph"
          )}
        >
          {children.map(renderInline)}
        </p>
      );
    case "heading": {
      const tag = (node.tag ?? "h2") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      const sizeMap: Record<string, string> = {
        h1: "text-4xl md:text-5xl mt-16",
        h2: "text-3xl md:text-4xl mt-14",
        h3: "text-2xl md:text-3xl mt-12",
        h4: "text-xl md:text-2xl mt-10",
        h5: "text-lg mt-8",
        h6: "text-base mt-6",
      };
      return React.createElement(
        tag,
        {
          key,
          className: cn(
            "font-serif font-bold leading-tight tracking-[-0.015em] text-on-surface text-balance",
            sizeMap[tag]
          ),
        },
        children.map(renderInline)
      );
    }
    case "list": {
      const Tag = node.tag === "ol" ? "ol" : "ul";
      return (
        <Tag
          key={key}
          className={cn(
            "mt-6 space-y-2 text-[18px] leading-[1.6] text-on-surface-muted pl-6",
            Tag === "ul" ? "list-disc marker:text-primary" : "list-decimal"
          )}
        >
          {children.map((c, i) => renderBlock(c, i, i, false))}
        </Tag>
      );
    }
    case "listitem":
      return <li key={key}>{children.map(renderInline)}</li>;
    case "quote":
      return (
        <blockquote
          key={key}
          className="mt-10 mb-2 rounded-[28px] bg-primary-container-dim text-on-primary-container px-8 py-6 font-serif italic text-2xl leading-snug text-balance"
          style={{ transform: "rotate(-0.6deg)" }}
        >
          {children.map(renderInline)}
        </blockquote>
      );
    default:
      if (children.length) {
        return <div key={key}>{children.map((c, i) => renderBlock(c, i, i, false))}</div>;
      }
      return null;
  }
}

export function LexicalRichText({ doc }: { doc: unknown }) {
  if (!doc || typeof doc !== "object" || !("root" in doc)) return null;
  const root = (doc as LexicalDoc).root;
  const blocks = root.children ?? [];

  // Index of the first paragraph — it gets the drop-cap treatment.
  const firstParaIdx = blocks.findIndex((n) => n.type === "paragraph");

  return (
    <div className="rich-text">
      {blocks.map((node, i) => renderBlock(node, i, i, i === firstParaIdx))}
    </div>
  );
}
