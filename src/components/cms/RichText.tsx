import Link from "next/link";
import { Fragment } from "react";
import { type Block, type Inline, parseRichText } from "@/lib/cms/rich-text";
import { cn } from "@/lib/utils";

const LINK = "text-primary-dark underline underline-offset-4 hover:no-underline";

function Inlines({ nodes }: { nodes: Inline[] }) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return <Fragment key={index}>{node.text}</Fragment>;
      case "break":
        return <br key={index} />;
      case "strong":
        return (
          <strong key={index} className="font-medium">
            <Inlines nodes={node.children} />
          </strong>
        );
      case "em":
        return (
          <em key={index}>
            <Inlines nodes={node.children} />
          </em>
        );
      case "link":
        // Internal paths use client navigation; everything else is a plain anchor.
        return node.href.startsWith("/") ? (
          <Link key={index} href={node.href} className={LINK}>
            <Inlines nodes={node.children} />
          </Link>
        ) : (
          <a
            key={index}
            href={node.href}
            className={LINK}
            rel={node.href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            <Inlines nodes={node.children} />
          </a>
        );
    }
  });
}

const HEADING = {
  2: "mt-12 font-serif text-h3 text-ink first:mt-0",
  3: "mt-10 font-serif text-h4 text-ink first:mt-0",
  4: "mt-8 font-sans text-lead font-medium text-ink first:mt-0",
} as const;

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as const;
      return (
        <Tag className={HEADING[block.level]}>
          <Inlines nodes={block.children} />
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p>
          <Inlines nodes={block.children} />
        </p>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={cn("flex flex-col gap-2 pl-6", block.ordered ? "list-decimal" : "list-disc")}
        >
          {block.items.map((item, index) => (
            <li key={index} className="pl-1 marker:text-primary-dark">
              <Inlines nodes={item} />
            </li>
          ))}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-2 border-primary-dark pl-5 font-serif text-h4 text-ink italic">
          <Inlines nodes={block.children} />
        </blockquote>
      );
    case "rule":
      return <hr className="my-4 border-line" />;
  }
}

interface RichTextProps {
  source: string;
  className?: string;
}

/** Renders stored rich text from its parsed tree: allowlisted elements only, no raw HTML. */
export function RichText({ source, className }: RichTextProps) {
  const blocks = parseRichText(source);
  if (blocks.length === 0) return null;
  return (
    <div className={cn("flex max-w-prose flex-col gap-5 text-ink", className)}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}
