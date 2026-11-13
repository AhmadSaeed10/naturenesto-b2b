"use client";

import { useId, useRef, useState } from "react";
import { RichText } from "@/components/cms/RichText";
import { CONTROL } from "@/components/admin/fields";
import { admin } from "@/content/admin";
import { isSafeHref } from "@/lib/cms/rich-text";
import { cn } from "@/lib/utils";

const copy = admin.content.editor;

interface RichTextEditorProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  invalid?: boolean;
}

type Action = "bold" | "italic" | "heading" | "bullet" | "numbered" | "quote" | "link";

const TOOL =
  "inline-flex min-h-(--size-tap) min-w-(--size-tap) items-center justify-center rounded-lg px-3 text-sm text-ink hover:bg-surface";

/**
 * Markdown subset editor: a plain textarea (fully keyboard and screen reader friendly)
 * with buttons that wrap or prefix the selection, and a preview using the storefront renderer.
 */
export function RichTextEditor({
  id,
  label,
  value,
  onChange,
  rows = 12,
  invalid = false,
}: RichTextEditorProps) {
  const uid = useId();
  const fieldId = id ?? `${uid}-field`;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");

  function apply(action: Action) {
    const area = ref.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end } = area;
    const selected = value.slice(start, end);
    let insert = selected;
    if (action === "bold") insert = `**${selected || copy.bold}**`;
    if (action === "italic") insert = `*${selected || copy.italic}*`;
    if (action === "link") {
      const url = window.prompt(copy.linkPrompt, "https://");
      if (!url || !isSafeHref(url)) return;
      insert = `[${selected || url}](${url})`;
    }
    if (
      action === "heading" ||
      action === "bullet" ||
      action === "numbered" ||
      action === "quote"
    ) {
      const lines = (selected || copy[action]).split("\n");
      insert = lines
        .map((line, index) => {
          const bare = line.replace(/^(#{1,4}\s+|[-*]\s+|\d+[.)]\s+|>\s?)/, "");
          if (action === "heading") return `## ${bare}`;
          if (action === "bullet") return `- ${bare}`;
          if (action === "numbered") return `${index + 1}. ${bare}`;
          return `> ${bare}`;
        })
        .join("\n");
      // Block syntax needs its own line.
      if (start > 0 && value[start - 1] !== "\n") insert = `\n${insert}`;
    }
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + insert.length, start + insert.length);
    });
  }

  const tools: { action: Action; label: string; glyph: string }[] = [
    { action: "bold", label: copy.bold, glyph: "B" },
    { action: "italic", label: copy.italic, glyph: "I" },
    { action: "heading", label: copy.heading, glyph: "H" },
    { action: "bullet", label: copy.bullet, glyph: "•" },
    { action: "numbered", label: copy.numbered, glyph: "1." },
    { action: "quote", label: copy.quote, glyph: "“" },
    { action: "link", label: copy.link, glyph: "↗" },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium">
          {label}
        </label>
        <div role="tablist" aria-label={label} className="flex gap-1">
          {(["write", "preview"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              aria-controls={`${uid}-${key}`}
              onClick={() => setTab(key)}
              className={cn(
                "min-h-(--size-tap) rounded-pill px-4 text-sm",
                tab === key ? "bg-primary-dark text-background" : "text-ink hover:bg-surface",
              )}
            >
              {copy[key]}
            </button>
          ))}
        </div>
      </div>

      <div
        id={`${uid}-write`}
        role="tabpanel"
        hidden={tab !== "write"}
        className="flex flex-col gap-1.5"
      >
        <div
          role="toolbar"
          aria-label={label}
          aria-controls={fieldId}
          className="flex flex-wrap gap-1"
        >
          {tools.map((tool) => (
            <button
              key={tool.action}
              type="button"
              className={TOOL}
              onClick={() => apply(tool.action)}
              title={tool.label}
            >
              <span
                aria-hidden="true"
                className={
                  tool.action === "bold" ? "font-medium" : tool.action === "italic" ? "italic" : ""
                }
              >
                {tool.glyph}
              </span>
              <span className="sr-only">{tool.label}</span>
            </button>
          ))}
        </div>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={`${uid}-help`}
          onChange={(event) => onChange(event.target.value)}
          className={cn(CONTROL, "py-2 font-mono text-sm")}
        />
        <p id={`${uid}-help`} className="text-xs text-ink-muted">
          {copy.help}
        </p>
      </div>

      <div
        id={`${uid}-preview`}
        role="tabpanel"
        hidden={tab !== "preview"}
        className="min-h-40 rounded-xl border border-line bg-background p-4"
      >
        {value.trim() ? (
          <RichText source={value} />
        ) : (
          <p className="text-sm text-ink-muted">{copy.empty}</p>
        )}
      </div>
    </div>
  );
}
