import * as React from "react";
import { useEditor, EditorContent, ReactRenderer, ReactNodeViewRenderer, NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Highlight } from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import tippy, { type Instance as TippyInstance } from "tippy.js";
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
  AtSign,
  CheckSquare,
  Trash2,
  Highlighter,
  Table as TableIcon,
  SeparatorHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MinusSquare,
  Mic,
  Lock,
  Send,
  FolderOpen,
} from "lucide-react";
import { users } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { FileAttachmentCard } from "@/components/file-attachment-card";
import { useParams } from "next/navigation";
import { AppDialog } from "@/components/ui/app-dialog";
import { AttachFromFilesDialog } from "@/components/attach-from-files-dialog";

const lowlight = createLowlight(all);

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "var(--h-yellow)", bg: "bg-[#fef08a] dark:bg-[#713f12]" },
  { name: "Blue", value: "var(--h-blue)", bg: "bg-[#bfdbfe] dark:bg-[#1e3a8a]" },
  { name: "Green", value: "var(--h-green)", bg: "bg-[#bbf7d0] dark:bg-[#14532d]" },
  { name: "Purple", value: "var(--h-purple)", bg: "bg-[#e9d5ff] dark:bg-[#581c87]" },
  { name: "Red", value: "var(--h-red)", bg: "bg-[#fecaca] dark:bg-[#7f1d1d]" },
];

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
  onSend?: () => void;
  sendDisabled?: boolean;
  showInternalOnly?: boolean;
  isInternal?: boolean;
  onInternalChange?: (val: boolean) => void;
  projectId?: string;
  clientId?: string;
  /** Hide the inline attachment tray below the editor — useful when the
   * attachments are already surfaced elsewhere (e.g. a task's Attachments
   * section) and showing them again here would be a duplicate. */
  showAttachmentsList?: boolean;
}

function CodeBlockComponent({ node }: any) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <NodeViewWrapper className="relative group/code-block my-3">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover/code-block:opacity-100 transition-opacity">
        <button
          onClick={copy}
          type="button"
          className="rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer flex items-center gap-1"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="!mt-0 !mb-0 rounded-xl bg-muted/40 p-4 font-mono text-xs leading-relaxed border border-border/80 overflow-x-auto text-foreground">
        <code className="bg-transparent !p-0 !text-inherit !rounded-none">
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}

export function RichEditor({
  value = "",
  onChange,
  placeholder = "Type your message...",
  minHeight = 160,
  attachments,
  onAttachmentsChange,
  className,
  footer,
  compact,
  onSend,
  sendDisabled,
  showInternalOnly,
  isInternal,
  onInternalChange,
  projectId,
  clientId,
  showAttachmentsList = true,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // keep heading extension for parsing, but remove toggle button
        codeBlock: false, // disable default code block in starter kit
        link: false, // we configure our own Link extension below with custom styling
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline underline-offset-2 font-medium" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl my-2 max-h-80" } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Mention.configure({
        HTMLAttributes: { class: "carina-mention text-primary font-semibold" },
        suggestion: mentionSuggestion,
      }),
      Mention.extend({
        name: "reference",
      }).configure({
        HTMLAttributes: { class: "carina-reference text-primary font-semibold cursor-pointer" },
        suggestion: referenceSuggestion,
      }),
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm max-w-none focus:outline-none leading-relaxed text-foreground min-h-[120px]",
          compact ? "min-h-[64px]" : "",
        ),
      },
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          event.preventDefault();
          pickFiles(event.dataTransfer.files);
          return true;
        }
        return false;
      },
      handlePaste(view, event, slice) {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          event.preventDefault();
          pickFiles(event.clipboardData.files);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  const [internalAttachments, setInternalAttachments] = React.useState<RichAttachment[]>([]);
  const atts = attachments ?? internalAttachments;
  const setAtts = onAttachmentsChange ?? setInternalAttachments;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Link Form State
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState("");

  // Highlight color picker state
  const [highlightOpen, setHighlightOpen] = React.useState(false);
  const highlightRef = React.useRef<HTMLDivElement>(null);

  // Speech Recognition state
  const [recognizing, setRecognizing] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  // App Files Selector Modal State
  const [isAppFileModalOpen, setIsAppFileModalOpen] = React.useState(false);

  const params = useParams();
  const routeProjectId = params?.projectId as string | undefined;
  const activeProjectId = routeProjectId;

  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const storageConnections = useStore((s) => s.storageConnections);
  const uploadDocument = useStore((s) => s.uploadDocument);

  const attachAppFile = (doc: any) => {
    const match = doc.size.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
    let sizeBytes = 1024;
    if (match) {
      const num = parseFloat(match[1]);
      const unit = (match[2] || "").toUpperCase();
      if (unit === "KB") sizeBytes = num * 1024;
      else if (unit === "MB") sizeBytes = num * 1024 * 1024;
      else if (unit === "GB") sizeBytes = num * 1024 * 1024 * 1024;
      else sizeBytes = num;
    }

    const ext = doc.name.split(".").pop()?.toLowerCase() || "";
    let type = "application/octet-stream";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
      type = `image/${ext === "jpg" ? "jpeg" : ext}`;
    } else if (ext === "pdf") {
      type = "application/pdf";
    }

    const att: RichAttachment = {
      id: doc.id,
      name: doc.name,
      size: sizeBytes,
      type,
      url: doc.previewUrl || "#",
    };

    setAtts([...atts, att]);

    if (type.startsWith("image/") && doc.previewUrl) {
      editor?.chain().focus().setImage({ src: doc.previewUrl, alt: doc.name }).run();
    }

    toast.success(`Attached ${doc.name} from app files`);
  };

  const removeAppFile = (doc: any) => {
    setAtts(atts.filter((a) => a.id !== doc.id));
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        if (editor && transcript) {
          editor.chain().focus().insertContent(transcript + " ").run();
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setRecognizing(false);
      };

      rec.onend = () => {
        setRecognizing(false);
      };

      recognitionRef.current = rec;
    }
  }, [editor]);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognizing) {
      recognitionRef.current.stop();
      setRecognizing(false);
      toast.success("Voice input stopped");
    } else {
      try {
        recognitionRef.current.start();
        setRecognizing(true);
        toast.success("Listening... Speak now");
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Keep editor content in sync with external value changes
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      if (!editor.isFocused || value === "") {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  // Close highlight picker on outside click
  React.useEffect(() => {
    if (!highlightOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!highlightRef.current?.contains(e.target as Node)) setHighlightOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [highlightOpen]);

  function pickFiles(files: FileList | null) {
    if (!files || !editor) return;
    const newAtts: RichAttachment[] = [];
    
    const activeConn = storageConnections.find((c) => c.connected);
    let folderPath = "client-portal";
    if (activeConn) {
      let targetClientName = "";
      if (projectId) {
        const proj = projects.find((p) => p.id === projectId);
        if (proj) {
          const cli = clients.find((c) => c.id === proj.clientId);
          if (cli) targetClientName = cli.name;
        }
      } else if (clientId) {
        const cli = clients.find((c) => c.id === clientId);
        if (cli) targetClientName = cli.name;
      }
      
      if (targetClientName) {
        folderPath = `client-portal/${targetClientName}`;
      }
    }

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
      
      if (activeConn) {
        uploadDocument({
          projectId: projectId || "",
          name: file.name,
          folder: folderPath,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          shared: true,
        });
      }
    });
    setAtts([...atts, ...newAtts]);
  }

  function handleLinkClick() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(prev ?? "https://");
    setLinkPopoverOpen(true);
  }

  function saveLink() {
    if (!editor) return;
    if (linkUrl.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      let href = linkUrl.trim();
      if (!/^https?:\/\//i.test(href)) {
        href = `https://${href}`;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
      toast.success("Link added successfully");
    }
    setLinkPopoverOpen(false);
    setLinkUrl("");
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkPopoverOpen(false);
    setLinkUrl("");
    toast.success("Link removed");
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
        "group rounded-2xl border border-border bg-background transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10 flex flex-col justify-between relative",
        className,
      )}
    >
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/5 px-2 py-1.5 select-none rounded-t-2xl">
          <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></ToolBtn>
          <ToolDivider />
          <div className="relative" ref={highlightRef}>
            <ToolBtn onClick={() => setHighlightOpen((v) => !v)} active={editor.isActive("highlight") || highlightOpen} label="Highlight color"><Highlighter className="h-3.5 w-3.5" /></ToolBtn>
            {highlightOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 flex items-center gap-1.5 rounded-xl border border-border bg-popover p-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setHighlight({ color: c.value }).run();
                      setHighlightOpen(false);
                    }}
                    className={cn(
                      "h-5 w-5 rounded-full border border-border/50 cursor-pointer hover:scale-110 transition-transform",
                      c.bg
                    )}
                    title={c.name}
                  />
                ))}
                <span className="mx-0.5 h-4 w-px bg-border" />
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setHighlightOpen(false);
                  }}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  title="Clear Highlight"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Quote"><Quote className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} label="Inline Code"><Code className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} label="Code Block"><Code className="h-3.5 w-3.5 border-b border-primary/45" /></ToolBtn>
          <ToolDivider />
          <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} label="Insert table"><TableIcon className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} label="Insert divider"><SeparatorHorizontal className="h-3.5 w-3.5" /></ToolBtn>
          <ToolDivider />
          <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bulleted list"><List className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} label="Checklist"><CheckSquare className="h-3.5 w-3.5" /></ToolBtn>
          <ToolDivider />
          <ToolBtn active={editor.isActive("link")} onClick={handleLinkClick} label="Link"><LinkIcon className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={insertMentionTrigger} label="Mention"><AtSign className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => fileInputRef.current?.click()} label="Attach from Device"><Paperclip className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => setIsAppFileModalOpen(true)} label="Attach from Files"><FolderOpen className="h-3.5 w-3.5" /></ToolBtn>

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

          {editor.isActive("table") && (
            <>
              <ToolDivider />
              <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} label="Add row before"><ChevronUp className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} label="Add row after"><ChevronDown className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} label="Delete row"><MinusSquare className="h-3.5 w-3.5" /></ToolBtn>
              <ToolDivider />
              <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} label="Add col before"><ChevronLeft className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} label="Add col after"><ChevronRight className="h-3.5 w-3.5" /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} label="Delete col"><MinusSquare className="h-3.5 w-3.5 rotate-90" /></ToolBtn>
              <ToolDivider />
              <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} label="Delete table" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></ToolBtn>
            </>
          )}
        </div>

        {/* Premium Inline Link Popover / Form */}
        {linkPopoverOpen && (
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-3 py-1.5 transition-all animate-in fade-in-0 duration-200">
            <span className="text-xs font-semibold text-muted-foreground">Link URL:</span>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-7 flex-1 rounded border border-border bg-card px-2 text-xs focus:border-primary focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveLink();
                }
              }}
            />
            <button
              type="button"
              onClick={saveLink}
              className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Save
            </button>
            {editor.isActive("link") && (
              <button
                type="button"
                onClick={removeLink}
                className="rounded border border-rose-200 dark:border-rose-950/45 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Unlink
              </button>
            )}
            <button
              type="button"
              onClick={() => setLinkPopoverOpen(false)}
              className="rounded border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        <EditorContent
          editor={editor}
          className="px-4 py-3"
          style={{ minHeight }}
        />
      </div>

      {showAttachmentsList && atts.length > 0 && (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border/60 p-3 bg-muted/5 max-h-48 overflow-y-auto scrollbar-thin", !(footer || onSend) && "rounded-b-2xl")}>
          {atts.map((a) => (
            <FileAttachmentCard
              key={a.id}
              id={a.id}
              name={a.name}
              size={formatBytes(a.size)}
              url={a.url}
              onRemove={() => setAtts(atts.filter((x) => x.id !== a.id))}
            />
          ))}
        </div>
      )}

      {onSend ? (
        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 bg-muted/5 rounded-b-2xl select-none">
          <div className="flex items-center gap-3">
            {showInternalOnly && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none font-semibold">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => onInternalChange?.(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
                />
                <Lock className="h-3 w-3" /> Internal only
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeech}
              title={recognizing ? "Stop listening" : "Voice input"}
              aria-label={recognizing ? "Stop listening" : "Voice input"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full transition-all duration-300 px-3.5 py-1.5 text-xs font-semibold border cursor-pointer select-none",
                recognizing
                  ? "border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 animate-pulse ring-2 ring-red-500/20"
                  : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {recognizing ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <Mic className="h-3 w-3" />
                  <span>Listening</span>
                </>
              ) : (
                <>
                  <Mic className="h-3 w-3" />
                  <span>Speak</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSend}
              disabled={sendDisabled}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-40 cursor-pointer transition-all"
            >
              <Send className="h-3 w-3" /> Send
            </button>
          </div>
        </div>
      ) : footer ? (
        <div className="border-t border-border/60 px-3 py-2.5 bg-muted/5 rounded-b-2xl">{footer}</div>
      ) : null}

      <AttachFromFilesDialog
        open={isAppFileModalOpen}
        onOpenChange={setIsAppFileModalOpen}
        projectId={activeProjectId}
        selectedIds={atts.map((a) => a.id)}
        onSelect={attachAppFile}
        onDeselect={removeAppFile}
      />
    </div>
  );
}

function ToolBtn({
  children,
  active,
  onClick,
  label,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer",
        active && "bg-primary/10 text-primary hover:bg-primary/15",
        className
      )}
    >
      {children}
    </button>
  );
}

function ToolDivider() {
  return <span className="mx-1 h-4 w-px bg-border" />;
}

export function formatBytes(n: number) {
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
    return <div className="rounded-xl border border-border bg-popover p-2 text-xs text-muted-foreground">No matches</div>;
  }

  return (
    <div className="min-w-[220px] rounded-xl border border-border bg-popover p-1 z-[9999]">
      {props.items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => select(i)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors cursor-pointer",
            i === idx ? "bg-primary/10 text-foreground animate-pulse" : "hover:bg-muted text-foreground",
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

/* ───────── Task / Project reference suggestion (# trigger) ───────── */

type ReferenceItem = { id: string; label: string; subtitle: string; type: "task" | "project" };

const referenceItems = (query: string): ReferenceItem[] => {
  const state = useStore.getState();
  const tasks = state.tasks;
  const projects = state.projects;

  const matchedTasks = tasks
    .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      label: t.title,
      subtitle: `Task · Stage: ${STAGE_META_LABELS[t.stage] || t.stage}`,
      type: "task" as const,
    }));

  const matchedProjects = projects
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      label: p.name,
      subtitle: `Project · Status: ${p.status}`,
      type: "project" as const,
    }));

  return [...matchedTasks, ...matchedProjects];
};

const STAGE_META_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
};

const ReferenceList = React.forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  { items: ReferenceItem[]; command: (item: { id: string; label: string }) => void }
>((props, ref) => {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => setIdx(0), [props.items]);

  const select = (i: number) => {
    const item = props.items[i];
    if (item) props.command({ id: item.id, label: `#${item.label}` });
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
    return <div className="rounded-xl border border-border bg-popover p-2 text-xs text-muted-foreground">No matches</div>;
  }

  return (
    <div className="min-w-[240px] rounded-xl border border-border bg-popover p-1 z-[9999] max-h-[260px] overflow-y-auto">
      {props.items.map((item, i) => (
        <button
          key={`${item.type}-${item.id}`}
          onClick={() => select(i)}
          className={cn(
            "flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
            i === idx ? "bg-primary/10 text-foreground animate-pulse" : "hover:bg-muted text-muted-foreground",
          )}
        >
          <span className="font-semibold text-foreground truncate max-w-xs">{item.label}</span>
          <span className="text-[10px] text-muted-foreground/80 mt-0.5">{item.subtitle}</span>
        </button>
      ))}
    </div>
  );
});
ReferenceList.displayName = "ReferenceList";

const referenceSuggestion = {
  char: "#",
  items: ({ query }: { query: string }) => referenceItems(query),
  render: () => {
    let component: ReactRenderer<{ onKeyDown: (p: { event: KeyboardEvent }) => boolean }> | null = null;
    let popup: TippyInstance[] = [];
    return {
      onStart: (props: any) => {
        component = new ReactRenderer(ReferenceList, { props, editor: props.editor });
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
