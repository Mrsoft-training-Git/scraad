import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 3, className }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after: string = before) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end) || "text";
    const next = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const linePrefix = (prefix: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.substring(0, start);
    const selection = value.substring(start, end) || "item";
    const after = value.substring(end);
    const lines = selection.split("\n").map((l, i) =>
      prefix === "1. " ? `${i + 1}. ${l}` : `${prefix}${l}`
    ).join("\n");
    onChange(before + lines + after);
    setTimeout(() => ta.focus(), 0);
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:", "https://");
    if (!url) return;
    wrap("[", `](${url})`);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-1 border border-input border-b-0 rounded-t-md bg-muted/30 px-1 py-1">
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => wrap("**")} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => wrap("*")} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => linePrefix("- ")} title="Bullet list">
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => linePrefix("1. ")} title="Numbered list">
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={insertLink} title="Link">
          <LinkIcon className="w-3.5 h-3.5" />
        </Button>
        <span className="ml-auto text-[10px] text-muted-foreground pr-2">Markdown supported</span>
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-t-none"
      />
    </div>
  );
}

export function renderMarkdown(text: string): string {
  if (!text) return "";
  // Escape HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Lists: group consecutive list lines
  const lines = html.split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  for (const line of lines) {
    const ulMatch = /^- (.*)$/.exec(line);
    const olMatch = /^\d+\.\s(.*)$/.exec(line);
    if (ulMatch) {
      if (listType !== "ul") { if (listType) out.push(`</${listType}>`); out.push('<ul class="list-disc list-inside">'); listType = "ul"; }
      out.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (listType !== "ol") { if (listType) out.push(`</${listType}>`); out.push('<ol class="list-decimal list-inside">'); listType = "ol"; }
      out.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (listType) { out.push(`</${listType}>`); listType = null; }
      out.push(line);
    }
  }
  if (listType) out.push(`</${listType}>`);
  return out.join("\n").replace(/\n/g, "<br/>");
}
