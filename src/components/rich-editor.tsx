import * as React from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Paperclip,
  Smile,
  AtSign,
  CheckSquare,
  Heading2,
} from "lucide-react";
import { users } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * RichEditor — the unified Tiptap editor for the MGL Client Platform.
 *
 * Features:
 *  - Formatting (bold, italic, strike, headings, lists, quote, code, link)
 *  - @mentions of users (mock dataset)
 *  - Emoji picker (emoji-mart)
 *  - File attachments rendered as chips (images preview inline)
 *  - Polished, consistent toolbar matching the MGL design system
 */

export type RichAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // object URL or remote
};

export interface RichEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  attachments?: RichAttachment[];
  onAttachmentsChange?: (a: RichAttachment[]) => void;
  className?: string;
  /** Render a custom footer (e.g. Send button). */
  footer?: React.ReactNode;
  /** Compact styling for comment/reply contexts. */
  compact?: boolean;
}

export function RichEditor({
  value = "",
  onChange,
  placeholder = "Write something…",
  minHeight = 120,
  attachments,
  onAttachmentsChange,
  className,
  footer,
  compact,
}: RichEditorProps) {
  const [internalAttachments, setInternalAttachments] = React.useState<RichAttachment[]>([]);
  const atts = attachments ?? internalAttachments;
  const setAtts = onAttachmentsChange ?? setInternalAttachments;

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const emojiRef = React.useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline underline-offset-2" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl my-2 max-h-80" } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Mention.configure({
        HTMLAttributes: { class: "mgl-mention" },
        suggestion: mentionSuggestion,
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm max-w-none focus:outline-none",
          compact ? "min-h-[64px]" : "",
        ),
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Close emoji on outside click
  React.useEffect(() => {
    if (!emojiOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!emojiRef.current?.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [emojiOpen]);

  function pickFiles(files: FileList | null) {
    if (!files || !editor) return;
    const newAtts: RichAttachment[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const att: RichAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        url,
      };
      newAtts.push(att);
      if (file.type.startsWith("image/")) {
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      }
    });
    setAtts([...atts, ...newAtts]);
  }

  function addLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function insertEmoji(emoji: { native?: string }) {
    if (editor && emoji.native) editor.chain().focus().insertContent(emoji.native).run();
    setEmojiOpen(false);
  }

  function insertMentionTrigger() {
    if (editor) editor.chain().focus().insertContent("@").run();
  }

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-background p-3",
          className,
        )}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={cn(
        "group rounded-2xl border border-border bg-background transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-2 py-1.5">
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></ToolBtn>
        <ToolDivider />
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Heading"><Heading2 className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Quote"><Quote className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} label="Code"><Code className="h-3.5 w-3.5" /></ToolBtn>
        <ToolDivider />
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bulleted list"><List className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} label="Checklist"><CheckSquare className="h-3.5 w-3.5" /></ToolBtn>
        <ToolDivider />
        <ToolBtn active={editor.isActive("link")} onClick={addLink} label="Link"><LinkIcon className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={insertMentionTrigger} label="Mention"><AtSign className="h-3.5 w-3.5" /></ToolBtn>
        <div className="relative" ref={emojiRef}>
          <ToolBtn onClick={() => setEmojiOpen((v) => !v)} active={emojiOpen} label="Emoji"><Smile className="h-3.5 w-3.5" /></ToolBtn>
          {emojiOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5">
              <Picker data={data} onEmojiSelect={insertEmoji} theme="light" previewPosition="none" skinTonePosition="none" />
            </div>
          )}
        </div>
        <ToolBtn onClick={() => fileInputRef.current?.click()} label="Attach"><Paperclip className="h-3.5 w-3.5" /></ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            pickFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <EditorContent
        editor={editor}
        className="px-4 py-3"
        style={{ minHeight }}
      />

      {atts.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border/60 px-3 py-2">
          {atts.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px]"
            >
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="max-w-[160px] truncate font-medium">{a.name}</span>
              <span className="text-muted-foreground">{formatBytes(a.size)}</span>
              <button
                onClick={() => setAtts(atts.filter((x) => x.id !== a.id))}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove attachment"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {footer && <div className="border-t border-border/60 px-3 py-2">{footer}</div>}
    </div>
  );
}

function ToolBtn({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-primary/10 text-primary hover:bg-primary/15",
      )}
    >
      {children}
    </button>
  );
}

function ToolDivider() {
  return <span className="mx-1 h-4 w-px bg-border" />;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/* ───────── Mention suggestion (popup with arrow nav) ───────── */

type MentionItem = { id: string; label: string; subtitle: string; color: string };

const mentionItems = (query: string): MentionItem[] =>
  users
    .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)
    .map((u) => ({ id: u.id, label: u.name, subtitle: u.title, color: u.color }));

const MentionList = React.forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  { items: MentionItem[]; command: (item: { id: string; label: string }) => void }
>((props, ref) => {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => setIdx(0), [props.items]);

  const select = (i: number) => {
    const item = props.items[i];
    if (item) props.command({ id: item.id, label: item.label });
  };

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setIdx((i) => (i + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setIdx((i) => (i + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        select(idx);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return <div className="rounded-xl border border-border bg-popover p-2 text-xs text-muted-foreground shadow-lg">No matches</div>;
  }

  return (
    <div className="min-w-[220px] rounded-xl border border-border bg-popover p-1 shadow-xl">
      {props.items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => select(i)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
            i === idx ? "bg-primary/10 text-foreground" : "hover:bg-muted",
          )}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: item.color }}
          >
            {item.label.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium leading-tight">{item.label}</span>
            <span className="block text-[11px] text-muted-foreground">{item.subtitle}</span>
          </span>
        </button>
      ))}
    </div>
  );
});
MentionList.displayName = "MentionList";

const mentionSuggestion = {
  items: ({ query }: { query: string }) => mentionItems(query),
  render: () => {
    let component: ReactRenderer<{ onKeyDown: (p: { event: KeyboardEvent }) => boolean }> | null = null;
    let popup: TippyInstance[] = [];
    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, { props, editor: props.editor });
        if (!props.clientRect) return;
        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },
      onUpdate(props: any) {
        component?.updateProps(props);
        if (!props.clientRect) return;
        popup[0]?.setProps({ getReferenceClientRect: props.clientRect });
      },
      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup[0]?.hide();
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },
      onExit() {
        popup[0]?.destroy();
        component?.destroy();
      },
    };
  },
};
