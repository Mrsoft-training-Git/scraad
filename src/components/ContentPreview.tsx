import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Video, Link as LinkIcon, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getFileExtension } from "@/components/DocumentViewer";

interface ContentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: {
    title: string;
    description?: string | null;
    content_type: string;
    content_url?: string | null;
  } | null;
  /** Provide one of these so private S3 files can be signed */
  courseId?: string;
  programId?: string;
}

const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /youtube\.com\/shorts\/([^&?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

const isPdfUrl = (url: string): boolean => {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
};

const isS3Url = (url: string): boolean =>
  url.startsWith("s3://") || /\.amazonaws\.com\//.test(url);

export const ContentPreview = ({ open, onOpenChange, content, courseId, programId }: ContentPreviewProps) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const rawUrl = content?.content_url ?? null;

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!open || !rawUrl) { setResolvedUrl(null); return; }
      if (!isS3Url(rawUrl)) { setResolvedUrl(rawUrl); return; }
      setResolving(true);
      try {
        const { data, error } = await supabase.functions.invoke("s3-get-signed-url", {
          body: programId ? { s3Url: rawUrl, programId } : { s3Url: rawUrl, courseId },
        });
        if (error) throw error;
        if (!cancelled) setResolvedUrl(data?.signedUrl || data?.url || null);
      } catch {
        if (!cancelled) setResolvedUrl(null);
      } finally {
        if (!cancelled) setResolving(false);
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [open, rawUrl, courseId, programId]);

  if (!content) return null;

  const renderContent = () => {
    if (resolving) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>Preparing secure preview…</p>
        </div>
      );
    }

    const url = resolvedUrl;

    
    if (!url) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mb-4" />
          <p>No content available to preview</p>
        </div>
      );
    }

    // YouTube video
    if (content.content_type === "video" && isYouTubeUrl(url)) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        return (
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={content.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        );
      }
    }

    // Video file
    if (content.content_type === "video") {
      return (
        <div className="aspect-video w-full">
          <video
            src={url}
            controls
            className="w-full h-full rounded-lg bg-black"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Documents: PDF/text inline, Office via viewer, images inline
    if (content.content_type === "document") {
      const ext = getFileExtension(url);
      if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) {
        return (
          <div className="w-full max-h-[70vh] overflow-auto rounded-lg border bg-muted/30 flex items-center justify-center">
            <img src={url} alt={content.title} className="max-w-full object-contain" />
          </div>
        );
      }
      if (isPdfUrl(url) || ["txt", "md", "json", "xml", "log", "csv"].includes(ext)) {
        return (
          <div className="w-full h-[70vh]">
            <iframe src={url} title={content.title} className="w-full h-full rounded-lg border" />
          </div>
        );
      }
      if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
        return (
          <div className="w-full h-[70vh]">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              title={content.title}
              className="w-full h-full rounded-lg border"
            />
          </div>
        );
      }
    }

    // Unsupported document type or Link
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        {content.content_type === "document" ? (
          <FileText className="w-16 h-16 text-primary" />
        ) : (
          <LinkIcon className="w-16 h-16 text-primary" />
        )}
        <p className="text-muted-foreground text-center max-w-md">
          {content.description || "Click the button below to open this resource."}
        </p>
        <Button asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open {content.content_type === "document" ? "Document" : "Link"}
          </a>
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {content.content_type === "video" && <Video className="w-5 h-5" />}
            {content.content_type === "document" && <FileText className="w-5 h-5" />}
            {content.content_type === "link" && <LinkIcon className="w-5 h-5" />}
            {content.title}
          </DialogTitle>
        </DialogHeader>
        
        {content.description && (
          <p className="text-sm text-muted-foreground mb-4">{content.description}</p>
        )}
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
