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

async function generatePresignedGetUrl(
  bucket: string,
  key: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  expiresIn: number = 900 // 15 minutes
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
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const encodedKey = key.split("/").map(segment => encodeURIComponent(segment)).join("/");
  const canonicalUri = `/${encodedKey}`;

  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hash(canonicalRequest),
  ].join("\n");

  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, "s3");
  const signature = toHex(await hmacSHA256(signingKey, stringToSign));

  const finalParams = new URLSearchParams(sortedParams);
  finalParams.set("X-Amz-Signature", signature);

  return `https://${host}${canonicalUri}?${finalParams.toString()}`;
}

// Parse s3://bucket/key  or  https://bucket.s3.region.amazonaws.com/key
function parseS3Url(url: string): { bucket: string; key: string } | null {
  // s3://bucket/key
  const s3Match = url.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (s3Match) return { bucket: s3Match[1], key: s3Match[2] };

  // https://bucket.s3.region.amazonaws.com/key
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

    const { s3Url, courseId } = await req.json();
    if (!s3Url || !courseId) {
      return new Response(JSON.stringify({ error: "s3Url and courseId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseS3Url(s3Url);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Invalid S3 URL format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Access control: admin, course instructor, or enrolled student
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin";

    if (!isAdmin) {
      const { data: course } = await adminClient
        .from("courses")
        .select("instructor_id")
        .eq("id", courseId)
        .maybeSingle();

      const isInstructor = course?.instructor_id === user.id;

      if (!isInstructor) {
        const { data: enrollment } = await adminClient
          .from("enrollments")
          .select("access_status, payment_status")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();

        if (
          !enrollment ||
          enrollment.access_status !== "active" ||
          !["paid", "partial"].includes(enrollment.payment_status)
        ) {
          return new Response(JSON.stringify({ error: "Access denied" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID")!;
    const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY")!;
    const awsRegion = Deno.env.get("AWS_REGION")!;

    // 15-minute signed URL
    const signedUrl = await generatePresignedGetUrl(
      parsed.bucket,
      parsed.key,
      awsRegion,
      awsAccessKeyId,
      awsSecretAccessKey,
      900
    );

    return new Response(JSON.stringify({ signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("s3-get-signed-url error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
