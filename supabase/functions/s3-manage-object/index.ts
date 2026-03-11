import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AWS Signature V4 helpers
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
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hash(data: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return toHex(buffer);
}

async function buildAuthHeader(
  method: string,
  bucket: string,
  key: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  additionalHeaders: Record<string, string> = {}
): Promise<{ headers: Record<string, string> }> {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const encodedKey = key.split("/").map(segment => encodeURIComponent(segment)).join("/");
  const canonicalUri = `/${encodedKey}`;

  const allHeaders: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    ...additionalHeaders,
  };

  const sortedHeaderNames = Object.keys(allHeaders).sort();
  const canonicalHeaders = sortedHeaderNames.map(h => `${h}:${allHeaders[h]}`).join("\n") + "\n";
  const signedHeaders = sortedHeaderNames.join(";");
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hash(canonicalRequest)].join("\n");

  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, "s3");
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    headers: {
      host,
      "x-amz-date": amzDate,
      authorization: authorizationHeader,
      "x-amz-content-sha256": payloadHash,
      ...additionalHeaders,
    },
  };
}

function parseS3Url(url: string): { bucket: string; key: string } | null {
  const s3Match = url.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (s3Match) return { bucket: s3Match[1], key: s3Match[2] };
  const httpsMatch = url.match(/^https?:\/\/([^.]+)\.s3\.[^.]+\.amazonaws\.com\/(.+?)(\?.*)?$/);
  if (httpsMatch) return { bucket: httpsMatch[1], key: decodeURIComponent(httpsMatch[2]) };
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only instructors and admins can manage S3 objects
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || !["admin", "instructor"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Only instructors and admins can manage S3 objects" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, s3Url, courseId } = body;

    if (!action || !s3Url) {
      return new Response(JSON.stringify({ error: "action and s3Url are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For instructors, verify they own the course
    if (roleData.role === "instructor" && courseId) {
      const { data: course } = await adminClient
        .from("courses")
        .select("instructor_id")
        .eq("id", courseId)
        .maybeSingle();

      if (course?.instructor_id !== user.id) {
        return new Response(JSON.stringify({ error: "Access denied: not your course" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const parsed = parseS3Url(s3Url);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Invalid S3 URL format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID")!;
    const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY")!;
    const awsRegion = Deno.env.get("AWS_REGION")!;
    const awsBucket = Deno.env.get("AWS_S3_BUCKET_NAME")!;

    // Verify bucket matches
    if (parsed.bucket !== awsBucket) {
      return new Response(JSON.stringify({ error: "Bucket mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      // DELETE the S3 object
      const { headers } = await buildAuthHeader("DELETE", awsBucket, parsed.key, awsRegion, awsAccessKeyId, awsSecretAccessKey);
      const host = `${awsBucket}.s3.${awsRegion}.amazonaws.com`;
      const encodedKey = parsed.key.split("/").map(segment => encodeURIComponent(segment)).join("/");
      const s3Res = await fetch(`https://${host}/${encodedKey}`, {
        method: "DELETE",
        headers,
      });

      if (!s3Res.ok && s3Res.status !== 204 && s3Res.status !== 404) {
        const errText = await s3Res.text();
        console.error("S3 delete error:", s3Res.status, errText);
        return new Response(JSON.stringify({ error: `S3 delete failed: ${s3Res.status}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, action: "deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "replace") {
      // Used when updating a video: delete the OLD S3 object so storage isn't wasted
      // The new upload is handled separately via s3-get-upload-url
      const { headers } = await buildAuthHeader("DELETE", awsBucket, parsed.key, awsRegion, awsAccessKeyId, awsSecretAccessKey);
      const host = `${awsBucket}.s3.${awsRegion}.amazonaws.com`;
      const encodedKey = parsed.key.split("/").map(segment => encodeURIComponent(segment)).join("/");
      const s3Res = await fetch(`https://${host}/${encodedKey}`, {
        method: "DELETE",
        headers,
      });

      // Log but don't fail on replace — old file cleanup is best-effort
      if (!s3Res.ok && s3Res.status !== 204 && s3Res.status !== 404) {
        console.warn("S3 replace/delete warning:", s3Res.status);
      }

      return new Response(JSON.stringify({ success: true, action: "replaced" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("s3-manage-object error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
