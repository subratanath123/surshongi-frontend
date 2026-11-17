"use client";

import { type ReactNode, useRef } from "react";
import { Bold, Italic, Link2, List } from "lucide-react";
import { useTranslations } from "next-intl";

const fieldClass =
  "w-full resize-y rounded-b-lg border border-t-0 border-border bg-white px-3 py-2.5 text-sm leading-6 text-[#222325] outline-none placeholder:text-[#95979d] focus-visible:border-[#5B35F5] focus-visible:ring-2 focus-visible:ring-[#5B35F5]/30";

export function RichTextField({
  value,
  onChange,
  placeholder,
  rows = 5,
  required,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  const t = useTranslations("Home");
  const ref = useRef<HTMLTextAreaElement>(null);

  function apply(next: string, selectFrom: number, selectTo: number) {
    onChange(next);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selectFrom, selectTo);
    });
  }

  function wrap(before: string, after = before) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || t("richSample");
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    apply(next, start + before.length, start + before.length + selected.length);
  }

  function makeList() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const blockStart = value.lastIndexOf("\n", start - 1) + 1;
    const blockEnd = value.indexOf("\n", end);
    const endAt = blockEnd === -1 ? value.length : blockEnd;
    const block = value.slice(blockStart, endAt);
    const listed = block
      .split("\n")
      .map((line) => (line.startsWith("- ") ? line : `- ${line || t("richSample")}`))
      .join("\n");
    const next = `${value.slice(0, blockStart)}${listed}${value.slice(endAt)}`;
    apply(next, blockStart, blockStart + listed.length);
  }

  const tools = [
    { id: "bold", label: t("richBold"), icon: Bold, run: () => wrap("**") },
    { id: "italic", label: t("richItalic"), icon: Italic, run: () => wrap("*") },
    { id: "list", label: t("richList"), icon: List, run: makeList },
    { id: "link", label: t("richLink"), icon: Link2, run: () => wrap("[", "](https://)") },
  ];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 rounded-t-lg border border-border bg-[#fafafa] p-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={tool.run}
            className="grid size-8 place-items-center rounded-md text-[#404145] hover:bg-white hover:text-[#222325]"
          >
            <tool.icon className="size-4" />
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        required={required}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </div>
  );
}

function inlineNodes(line: string): ReactNode[] {
  const pattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  return line.split(pattern).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  function flushList() {
    if (list.length === 0) return;
    const items = list;
    list = [];
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>{inlineNodes(item)}</li>
        ))}
      </ul>,
    );
  }

  lines.forEach((line) => {
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      return;
    }
    flushList();
    if (line.trim() === "") {
      blocks.push(<div key={`gap-${blocks.length}`} className="h-2" />);
      return;
    }
    blocks.push(
      <p key={`p-${blocks.length}`} className="whitespace-pre-wrap">
        {inlineNodes(line)}
      </p>,
    );
  });
  flushList();

  return <div className={className}>{blocks}</div>;
}
