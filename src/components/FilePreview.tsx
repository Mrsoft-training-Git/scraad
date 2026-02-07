import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Video, Image, Code, FileUp, ExternalLink, X, Download } from "lucide-react";

interface FilePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName?: string;
}

const getFileType = (url: string): "image" | "video" | "pdf" | "code" | "other" => {
  const extension = url.split('.').pop()?.toLowerCase() || "";
  
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

export const FilePreview = ({ open, onOpenChange, fileUrl, fileName }: FilePreviewProps) => {
  const fileType = getFileType(fileUrl);
  const displayName = fileName || fileUrl.split('/').pop() || "File";

  const renderPreview = () => {
    switch (fileType) {
      case "image":
        return (
          <div className="flex items-center justify-center w-full">
            <img 
              src={fileUrl} 
              alt={displayName} 
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        );
      
      case "video":
        return (
          <div className="w-full aspect-video">
            <video 
              src={fileUrl} 
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
              src={fileUrl} 
              title={displayName}
              className="w-full h-full rounded-lg border"
            />
          </div>
        );
      
      case "code":
        return (
          <div className="w-full h-[70vh]">
            <iframe 
              src={fileUrl} 
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
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={fileUrl} download={displayName}>
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
          <Button variant="outline" asChild>
            <a href={fileUrl} download={displayName}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
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
}

export const FilePreviewButton = ({ fileUrl, fileName }: FilePreviewButtonProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileType = getFileType(fileUrl);
  const displayName = fileName || fileUrl.split('/').pop() || "File";

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
      />
    </>
  );
};
