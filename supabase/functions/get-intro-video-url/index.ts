// Public edge function: returns a short-lived signed URL for a course/program
// intro video. Unlike s3-get-signed-url (which gates on enrollment), this one
// is intentionally public — intro videos are marketing previews and must be
// viewable by unauthenticated visitors browsing the catalog.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- AWS SigV4 helpers ---
async function hmacSHA256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}
async function getSigningKey(secretKey: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSHA256(new TextEncoder().encode(`AWS4${secretKey}`), date);
  const kRegion = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  return hmacSHA256(kService, "aws4_request");
}
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sha256Hash(data: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return toHex(buffer);
}
async function generatePresignedGetUrl(
  bucket: string, key: string, region: string,
  accessKeyId: string, secretAccessKey: string, expiresIn = 900,
): Promise<string> {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expiresIn.toString(),
    "X-Amz-SignedHeaders": "host",
  });
  const sortedParams = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const canonicalQueryString = sortedParams
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";
  const encodedKey = key.split("/").map((s) => encodeURIComponent(s)).join("/");
  const canonicalUri = `/${encodedKey}`;
  const canonicalRequest = ["GET", canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hash(canonicalRequest)].join("\n");
  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, "s3");
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));
  const finalParams = new URLSearchParams(sortedParams);
  finalParams.set("X-Amz-Signature", signature);
  return `https://${host}${canonicalUri}?${finalParams.toString()}`;
}

function parseS3Url(url: string): { bucket: string; key: string } | null {
  const s3 = url.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (s3) return { bucket: s3[1], key: s3[2] };
  const https = url.match(/^https?:\/\/([^.]+)\.s3\.[^.]+\.amazonaws\.com\/(.+?)(\?.*)?$/);
  if (https) return { bucket: https[1], key: decodeURIComponent(https[2]) };
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { s3Url, kind, id } = await req.json();
    // Either pass an explicit s3Url, OR (kind + id) and we look it up.
    // kind: "course" | "program"
    if (!s3Url && !(kind && id)) {
      return new Response(JSON.stringify({ error: "Provide s3Url, or kind + id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resolvedUrl = s3Url as string | undefined;
    if (!resolvedUrl) {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const table = kind === "program" ? "programs" : "courses";
      const { data, error } = await adminClient
        .from(table).select("intro_video_url").eq("id", id).maybeSingle();
      if (error || !data?.intro_video_url) {
        return new Response(JSON.stringify({ error: "No intro video set" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      resolvedUrl = data.intro_video_url as string;
    }

    // External URLs (YouTube/Vimeo/direct https mp4) are returned as-is
    if (!resolvedUrl!.startsWith("s3://") && !/\.amazonaws\.com\//.test(resolvedUrl!)) {
      return new Response(JSON.stringify({ url: resolvedUrl, signedUrl: resolvedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseS3Url(resolvedUrl!);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Invalid S3 URL format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signedUrl = await generatePresignedGetUrl(
      parsed.bucket, parsed.key,
      Deno.env.get("AWS_REGION")!,
      Deno.env.get("AWS_ACCESS_KEY_ID")!,
      Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
      900,
    );

    return new Response(JSON.stringify({ url: signedUrl, signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-intro-video-url error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
