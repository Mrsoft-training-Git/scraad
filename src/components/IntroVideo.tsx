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
  // External http(s) URLs that aren't S3 — return as-is
  if ((rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) && !/\.amazonaws\.com\//.test(rawUrl)) {
    return rawUrl;
  }
  if (rawUrl.startsWith("s3://") || /\.amazonaws\.com\//.test(rawUrl)) {
    try {
      const { data, error } = await supabase.functions.invoke("get-intro-video-url", {
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
  /** When true, the video will auto-play on hover. Disabled on touch. */
  hoverPlay?: boolean;
  /** Optionally control hover state from a parent (e.g. hover the whole card). */
  externalHover?: boolean;
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
  externalHover,
}: IntroVideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [internalHover, setInternalHover] = useState(false);
  const hovering = externalHover !== undefined ? externalHover : internalHover;
  const fallbackPoster =
    posterUrl ||
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80";

  const isEmbed = !!videoUrl && isYoutubeOrVimeo(videoUrl);
  const playable = !!videoUrl;

  // Build an embed URL for YouTube/Vimeo with autoplay+mute for hover preview
  const embedUrl = (() => {
    if (!videoUrl || !isEmbed) return null;
    const yt = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=0&controls=0&loop=1&playlist=${yt[1]}&modestbranding=1&rel=0&playsinline=1`;
    const vi = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1&muted=0&loop=1&background=1`;
    return null;
  })();

  // Resolve the video URL eagerly (not just on hover) so the first frame shows
  useEffect(() => {
    let cancelled = false;
    if (playable && !isEmbed && videoUrl && !resolvedSrc) {
      resolveVideoUrl(videoUrl).then((u) => {
        if (!cancelled) setResolvedSrc(u);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [playable, isEmbed, videoUrl, resolvedSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering && resolvedSrc) {
      // Try to play with sound first; if browser blocks, fall back to muted
      v.muted = false;
      v.volume = 1;
      v.play().catch(() => {
        v.muted = true;
        v.play().catch(() => {});
      });
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovering, resolvedSrc]);

  const showVideoLayer = playable && !isEmbed && !!resolvedSrc;

  return (
    <div
      className={cn("relative w-full h-full overflow-hidden bg-black", className)}
      onMouseEnter={() => hoverPlay && externalHover === undefined && setInternalHover(true)}
      onMouseLeave={() => externalHover === undefined && setInternalHover(false)}
    >
      {/* Poster only shown when no playable video resolved yet */}
      {!showVideoLayer && (
        <img
          src={fallbackPoster}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      )}
      {showVideoLayer && (
        <video
          ref={videoRef}
          src={resolvedSrc}
          poster={fallbackPoster}
          playsInline
          loop
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {playable && isEmbed && hovering && embedUrl && (
        <iframe
          src={embedUrl}
          title={alt}
          className="absolute inset-0 w-full h-full pointer-events-none"
          allow="autoplay; encrypted-media; picture-in-picture"
          frameBorder={0}
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
