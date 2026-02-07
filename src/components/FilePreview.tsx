import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Video, Image, Code, FileUp, ExternalLink, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FilePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName?: string;
  bucketName?: string;
}

const getFileType = (url: string): "image" | "video" | "pdf" | "code" | "other" => {
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0] || "";
  
  // Images
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(extension)) {
    return "image";
  }
  
  // Videos
  if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(extension)) {
    return "video";
  }
  
  // PDF
  if (extension === "pdf") {
    return "pdf";
  }
  
  // Code files
  if (["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "cs", "html", "css", "json", "xml", "sql", "md", "txt"].includes(extension)) {
    return "code";
  }
  
  return "other";
};

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "image":
      return <Image className="w-5 h-5" />;
    case "video":
      return <Video className="w-5 h-5" />;
    case "pdf":
      return <FileText className="w-5 h-5" />;
    case "code":
      return <Code className="w-5 h-5" />;
    default:
      return <FileUp className="w-5 h-5" />;
  }
};

// Helper to get signed URL for private buckets
const getSignedUrl = async (bucketName: string, filePath: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  return data.signedUrl;
};

export const FilePreview = ({ open, onOpenChange, fileUrl, fileName, bucketName = "assignment-submissions" }: FilePreviewProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileType = getFileType(fileUrl);
  const displayName = fileName || fileUrl.split('/').pop() || "File";

  useEffect(() => {
    if (open && fileUrl) {
      // Check if this is already a full URL or a storage path
      if (fileUrl.startsWith("http")) {
        setSignedUrl(fileUrl);
      } else {
        // It's a storage path, generate signed URL
        setLoading(true);
        getSignedUrl(bucketName, fileUrl).then((url) => {
          setSignedUrl(url);
          setLoading(false);
        });
      }
    }
  }, [open, fileUrl, bucketName]);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!signedUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <FileUp className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Unable to load file preview.
          </p>
        </div>
      );
    }

    switch (fileType) {
      case "image":
        return (
          <div className="flex items-center justify-center w-full">
            <img 
              src={signedUrl} 
              alt={displayName} 
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        );
      
      case "video":
        return (
          <div className="w-full aspect-video">
            <video 
              src={signedUrl} 
              controls 
              className="w-full h-full rounded-lg bg-black"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case "pdf":
        return (
          <div className="w-full h-[70vh]">
            <iframe 
              src={signedUrl} 
              title={displayName}
              className="w-full h-full rounded-lg border"
            />
          </div>
        );
      
      case "code":
        return (
          <div className="w-full h-[70vh]">
            <iframe 
              src={signedUrl} 
              title={displayName}
              className="w-full h-full rounded-lg border bg-muted font-mono text-sm"
            />
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <FileUp className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              This file type cannot be previewed directly.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={signedUrl} download={displayName}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(fileType)}
            {displayName}
          </DialogTitle>
        </DialogHeader>
        {renderPreview()}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" asChild disabled={!signedUrl}>
            <a href={signedUrl || "#"} download={displayName}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
          <Button variant="outline" asChild disabled={!signedUrl}>
            <a href={signedUrl || "#"} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Inline preview button component for use in lists
interface FilePreviewButtonProps {
  fileUrl: string;
  fileName?: string;
  bucketName?: string;
}

export const FilePreviewButton = ({ fileUrl, fileName, bucketName = "assignment-submissions" }: FilePreviewButtonProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileType = getFileType(fileUrl);
  // Extract just the filename from the path for display
  const displayName = fileName || fileUrl.split('/').pop()?.split('?')[0] || "File";

  return (
    <>
      <button
        onClick={() => setPreviewOpen(true)}
        className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer"
      >
        {getFileIcon(fileType)}
        <span className="truncate max-w-[200px]">{displayName}</span>
      </button>
      <FilePreview 
        open={previewOpen} 
        onOpenChange={setPreviewOpen} 
        fileUrl={fileUrl} 
        fileName={displayName}
        bucketName={bucketName}
      />
    </>
  );
};
