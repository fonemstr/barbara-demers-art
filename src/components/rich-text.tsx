import React from "react";

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
      <a key={key} href={node.url} className="underline underline-offset-4">
        {(node.children ?? []).map(renderInline)}
      </a>
    );
  }

  if (node.type === "linebreak") {
    return <br key={key} />;
  }

  return (node.children ?? []).map(renderInline);
}

function renderBlock(node: LexicalNode, key: number): React.ReactNode {
  const children = node.children ?? [];
  switch (node.type) {
    case "paragraph":
      return <p key={key}>{children.map(renderInline)}</p>;
    case "heading": {
      const Tag = (node.tag ?? "h2") as keyof React.JSX.IntrinsicElements;
      return <Tag key={key}>{children.map(renderInline)}</Tag>;
    }
    case "list": {
      const Tag = node.tag === "ol" ? "ol" : "ul";
      return <Tag key={key}>{children.map(renderBlock)}</Tag>;
    }
    case "listitem":
      return <li key={key}>{children.map(renderInline)}</li>;
    case "quote":
      return <blockquote key={key}>{children.map(renderInline)}</blockquote>;
    default:
      if (children.length) {
        return <div key={key}>{children.map(renderBlock)}</div>;
      }
      return null;
  }
}

export function LexicalRichText({ doc }: { doc: unknown }) {
  if (!doc || typeof doc !== "object" || !("root" in doc)) return null;
  const root = (doc as LexicalDoc).root;
  return <>{(root.children ?? []).map(renderBlock)}</>;
}
