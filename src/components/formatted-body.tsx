import * as React from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { FileAttachmentCard } from "@/components/file-attachment-card";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { downloadDocument } from "@/lib/download-document";

export type FormattedBodyProps = {
  html: string;
};

export function FormattedBody({ html }: { html: string }) {
  if (!html) return null;

  // Split HTML string by `<pre><code ...>...</code></pre>` blocks
  const parts = html.split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g);

  return (
    <div className="tiptap prose prose-sm max-w-none text-sm text-foreground/90 leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith("<pre><code")) {
          // Extract class language if available
          const langMatch = part.match(/class="[^"]*language-([^"\s]+)/);
          const lang = langMatch ? langMatch[1] : "";
          const contentMatch = part.match(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/);
          const rawCode = contentMatch ? contentMatch[1] : "";

          // Decode basic HTML entities for clean clipboard copying
          const decodedCode = rawCode
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");

          return <CodeBlockRender key={index} code={decodedCode} html={rawCode} lang={lang} />;
        }

        return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </div>
  );
}

function CodeBlockRender({ code, html, lang }: { code: string; html: string; lang: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code-block my-3 rounded-xl border border-border bg-muted/40 overflow-hidden">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover/code-block:opacity-100 transition-opacity">
        <button
          onClick={copy}
          type="button"
          className="rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer flex items-center gap-1"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {lang && (
        <div className="absolute left-3 top-2 text-[10px] font-mono text-muted-foreground/60 uppercase select-none font-bold">
          {lang}
        </div>
      )}
      <pre className={cn("p-4 font-mono text-xs leading-relaxed overflow-x-auto !my-0 text-foreground", lang ? "pt-8" : "")}>
        <code className="text-inherit" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

export function CommentAttachmentsList({ attachmentIds }: { attachmentIds?: string[] }) {
  const documents = useStore((s) => s.documents);
  const [previewDoc, setPreviewDoc] = React.useState<{ name: string; size: string; previewUrl?: string; storagePath?: string } | null>(null);

  if (!attachmentIds || attachmentIds.length === 0) return null;

  // Filter documents in store matching these ids
  const matchedDocs = documents.filter((doc) => attachmentIds.includes(doc.id));
  if (matchedDocs.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
        {matchedDocs.map((doc) => (
          <FileAttachmentCard
            key={doc.id}
            id={doc.id}
            name={doc.name}
            size={doc.size}
            url={doc.previewUrl || "#"}
            onPreview={() => setPreviewDoc({ name: doc.name, size: doc.size, previewUrl: doc.previewUrl, storagePath: doc.storagePath })}
          />
        ))}
      </div>
      <FilePreviewDialog
        file={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={(f) => downloadDocument(f)}
      />
    </>
  );
}
