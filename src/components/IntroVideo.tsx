import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Resolve an intro video URL to something the <video> element can play.
 * - s3:// → request a signed URL via the s3-get-signed-url edge function
 * - https:// (mp4/webm) → return as-is
 * - YouTube/Vimeo links → returned unchanged (caller should detect and use an iframe)
 */
async function resolveVideoUrl(rawUrl: string): Promise<string | null> {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("s3://")) {
    try {
      const { data, error } = await supabase.functions.invoke("s3-get-signed-url", {
        body: { s3Url: rawUrl },
      });
      if (error) throw error;
      return (data as any)?.url || (data as any)?.signedUrl || null;
    } catch (err) {
      console.error("Failed to sign intro video URL", err);
      return null;
    }
  }
  return rawUrl;
}

export function isYoutubeOrVimeo(url: string | null | undefined) {
  if (!url) return false;
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

interface IntroVideoCardProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  alt?: string;
  className?: string;
  /** When true, the video will auto-play muted on hover. Disabled on touch. */
  hoverPlay?: boolean;
}

/**
 * Compact intro video for use inside cards.
 * - Shows the poster image by default (looks like a normal image card)
 * - On hover (desktop), the muted intro video plays in-place
 * - Falls back to just the poster image if no video is set
 */
export const IntroVideoCard = ({
  videoUrl,
  posterUrl,
  alt = "",
  className,
  hoverPlay = true,
}: IntroVideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const fallbackPoster =
    posterUrl ||
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80";

  // YouTube/Vimeo can't be auto-played as a <video> source; treat as image-only on cards
  const playable = !!videoUrl && !isYoutubeOrVimeo(videoUrl);

  useEffect(() => {
    let cancelled = false;
    if (hovering && playable && videoUrl && !resolvedSrc) {
      resolveVideoUrl(videoUrl).then((u) => {
        if (!cancelled) setResolvedSrc(u);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [hovering, playable, videoUrl, resolvedSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering && resolvedSrc) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovering, resolvedSrc]);

  return (
    <div
      className={cn("relative w-full h-full overflow-hidden", className)}
      onMouseEnter={() => hoverPlay && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <img
        src={fallbackPoster}
        alt={alt}
        loading="lazy"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          hovering && resolvedSrc ? "opacity-0" : "opacity-100"
        )}
      />
      {playable && resolvedSrc && (
        <video
          ref={videoRef}
          src={resolvedSrc}
          muted
          playsInline
          loop
          preload="none"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            hovering ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {playable && (
        <div
          className={cn(
            "absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-opacity",
            hovering ? "opacity-0" : "opacity-100"
          )}
          aria-hidden
        >
          <Play className="w-3 h-3 fill-current" />
        </div>
      )}
    </div>
  );
};

interface IntroVideoHeroProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Full-bleed hero player for course/program details pages.
 * - Renders a <video> with controls and a poster
 * - For YouTube/Vimeo links, embeds an iframe
 * - Falls back to a static image if no video is set
 */
export const IntroVideoHero = ({
  videoUrl,
  posterUrl,
  alt = "",
  className,
}: IntroVideoHeroProps) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const fallbackPoster =
    posterUrl ||
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80";

  useEffect(() => {
    let cancelled = false;
    if (videoUrl && !isYoutubeOrVimeo(videoUrl)) {
      resolveVideoUrl(videoUrl).then((u) => {
        if (!cancelled) setResolvedSrc(u);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <img src={fallbackPoster} alt={alt} className={cn("w-full h-full object-cover", className)} />
    );
  }

  if (isYoutubeOrVimeo(videoUrl)) {
    // Convert standard YouTube/Vimeo links to embed form
    let embed = videoUrl;
    const yt = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
    const vi = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vi) embed = `https://player.vimeo.com/video/${vi[1]}`;
    return (
      <iframe
        src={embed}
        title={alt}
        className={cn("w-full h-full", className)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      key={resolvedSrc || "loading"}
      src={resolvedSrc || undefined}
      poster={fallbackPoster}
      controls
      playsInline
      preload="metadata"
      className={cn("w-full h-full object-cover bg-black", className)}
    />
  );
};
