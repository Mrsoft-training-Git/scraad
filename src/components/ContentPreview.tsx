import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Video, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: {
    title: string;
    description?: string | null;
    content_type: string;
    content_url?: string | null;
  } | null;
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
  return url.toLowerCase().endsWith(".pdf");
};

export const ContentPreview = ({ open, onOpenChange, content }: ContentPreviewProps) => {
  if (!content) return null;

  const renderContent = () => {
    const url = content.content_url;
    
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

    // PDF document
    if (content.content_type === "document" && isPdfUrl(url)) {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={url}
            title={content.title}
            className="w-full h-full rounded-lg border"
          />
        </div>
      );
    }

    // Document (non-PDF) or Link
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
