import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Raw S3 url (s3:// or https://...amazonaws.com/...) or a plain public url */
  fileUrl: string | null;
  title?: string;
  /** Provide one of these so private S3 files can be signed */
  courseId?: string;
  programId?: string;
}

const isS3Url = (url: string) => url.startsWith("s3://") || /\.amazonaws\.com\//.test(url);

export const getFileExtension = (url: string) =>
  (url.split("?")[0].split("#")[0].split(".").pop() || "").toLowerCase();

export const getFileNameFromUrl = (url: string) => {
  const clean = url.split("?")[0].split("#")[0];
  return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || "Document";
};

type Kind = "pdf" | "image" | "office" | "text" | "video" | "audio" | "other";

const getKind = (ext: string): Kind => {
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv"].includes(ext)) return "office";
  if (["txt", "md", "json", "xml", "log"].includes(ext)) return "text";
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "aac"].includes(ext)) return "audio";
  return "other";
};

export const DocumentViewer = ({ open, onOpenChange, fileUrl, title, courseId, programId }: DocumentViewerProps) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      setFailed(false);
      if (!open || !fileUrl) { setResolvedUrl(null); return; }
      if (!isS3Url(fileUrl)) { setResolvedUrl(fileUrl); return; }
      setResolving(true);
      try {
        const { data, error } = await supabase.functions.invoke("s3-get-signed-url", {
          body: programId ? { s3Url: fileUrl, programId } : { s3Url: fileUrl, courseId },
        });
        if (error) throw error;
        const link = data?.signedUrl || data?.url || null;
        if (!cancelled) { setResolvedUrl(link); setFailed(!link); }
      } catch {
        if (!cancelled) { setResolvedUrl(null); setFailed(true); }
      } finally {
        if (!cancelled) setResolving(false);
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [open, fileUrl, courseId, programId]);

  const name = title || (fileUrl ? getFileNameFromUrl(fileUrl) : "Document");
  const kind = getKind(getFileExtension(fileUrl || ""));

  const handleDownload = async () => {
    if (!resolvedUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(resolvedUrl);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: let the browser handle it
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };


  const renderBody = () => {
    if (resolving) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>Preparing secure preview…</p>
        </div>
      );
    }

    if (!resolvedUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <FileText className="w-12 h-12" />
          <p>{failed ? "You don't have access to this file, or it could not be loaded." : "No document available."}</p>
        </div>
      );
    }

    if (kind === "image") {
      return (
        <div className="w-full max-h-[72vh] overflow-auto rounded-lg border bg-muted/30 flex items-center justify-center">
          <img src={resolvedUrl} alt={name} className="max-w-full object-contain" />
        </div>
      );
    }

    if (kind === "video") {
      return <video src={resolvedUrl} controls className="w-full max-h-[72vh] rounded-lg bg-black" />;
    }

    if (kind === "audio") {
      return <audio src={resolvedUrl} controls className="w-full" />;
    }

    if (kind === "pdf" || kind === "text") {
      return (
        <iframe
          src={resolvedUrl}
          title={name}
          className="w-full h-[72vh] rounded-lg border bg-background"
        />
      );
    }

    if (kind === "office") {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedUrl)}`}
          title={name}
          className="w-full h-[72vh] rounded-lg border bg-background"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <FileText className="w-14 h-14 text-primary" />
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          This file type can't be previewed in the browser. Download it to view.
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8 text-left">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{name}</span>
          </DialogTitle>
        </DialogHeader>

        {renderBody()}

        {resolvedUrl && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Open in new tab
              </a>
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};
