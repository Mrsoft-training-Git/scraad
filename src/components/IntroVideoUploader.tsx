import { useRef, useState } from "react";
import { Upload, X, Video as VideoIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IntroVideoUploaderProps {
  /** Current value (s3:// URL, https URL, or YouTube/Vimeo link) */
  value: string;
  onChange: (url: string) => void;
  /** S3 path prefix, e.g. "courses/{id}/intro" or "programs/{id}/intro". 
   *  When the entity has no id yet (creating), pass a temp id like `new-${Date.now()}`. */
  pathPrefix: string;
  label?: string;
  helperText?: string;
}

const ACCEPTED = "video/mp4,video/quicktime,video/webm,video/x-msvideo,video/mpeg";

export const IntroVideoUploader = ({
  value,
  onChange,
  pathPrefix,
  label = "Introductory Video",
  helperText = "Short preview video shown on cards and the details page (max 200MB recommended).",
}: IntroVideoUploaderProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const { data, error } = await supabase.functions.invoke("s3-get-upload-url", {
        body: {
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          pathPrefix,
        },
      });
      if (error) throw error;
      const { uploadUrl, s3Url } = data as { uploadUrl: string; s3Url: string };

      // PUT directly to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      onChange(s3Url);
      toast({ title: "Intro video uploaded" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-border rounded-lg p-4">
        {value ? (
          <div className="flex items-center justify-between gap-3 bg-muted/40 rounded-md px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <VideoIcon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm truncate">{value}</span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onChange("")}
              aria-label="Remove intro video"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            className="cursor-pointer text-center py-3"
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                Uploading… {progress}%
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">Click to upload an intro video</p>
                <p className="text-xs text-muted-foreground/70">MP4, MOV, WebM</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Or paste link:</span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… (YouTube, Vimeo, or direct .mp4)"
          className="h-8 text-xs"
        />
      </div>
      <p className="text-xs text-muted-foreground">{helperText}</p>
    </div>
  );
};
