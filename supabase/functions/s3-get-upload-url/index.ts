import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AWS Signature V4 helpers (pure Deno — no SDK needed)
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

// Generate a pre-signed PUT URL for uploading directly to S3
async function generatePresignedPutUrl(
  bucket: string,
  key: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  // Include content-type in signed headers so the browser PUT header matches the signature
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expiresIn.toString(),
    "X-Amz-SignedHeaders": "content-type;host",
  });

  // Sort params for canonical query string
  const sortedParams = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const canonicalQueryString = sortedParams
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  // Headers must be sorted lexicographically for canonical request
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const encodedKey = key.split("/").map(segment => encodeURIComponent(segment)).join("/");
  const canonicalUri = `/${encodedKey}`;

  const canonicalRequest = [
    "PUT",
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

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    const { courseId, fileName, contentType, fileSize } = body;
    // Optional: pathPrefix overrides default `courses/{courseId}/lessons/`
    // Accepted values: "courses/{id}/lessons", "courses/{id}/intro", "programs/{id}/intro", etc.
    const pathPrefix: string | undefined = body.pathPrefix;

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const isStaff = !!roleData && ["admin", "instructor"].includes(roleData.role);

    if (!isStaff) {
      // Enrolled students may only upload their own assignment submissions
      const match = (pathPrefix || "").replace(/^\/+|\/+$/g, "")
        .match(/^programs\/([0-9a-fA-F-]{36})\/submissions\/([0-9a-fA-F-]{36})$/);
      const allowedSubmission = match && match[2] === user.id;

      if (allowedSubmission) {
        const { data: enrollment } = await adminClient
          .from("program_enrollments")
          .select("id")
          .eq("program_id", match![1])
          .eq("user_id", user.id)
          .maybeSingle();
        if (!enrollment) {
          return new Response(JSON.stringify({ error: "You are not enrolled in this program" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: "Not allowed to upload to this location" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if ((!courseId && !pathPrefix) || !fileName) {
      return new Response(JSON.stringify({ error: "fileName and (courseId or pathPrefix) are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The browser sends the exact same Content-Type header on the PUT, so we must
    // sign whatever it gave us (some OS/browsers report a generic type).
    const effectiveContentType: string =
      typeof contentType === "string" && contentType.trim()
        ? contentType.trim()
        : "application/octet-stream";

    // Validate file type (videos + documents)
    const allowedTypes = [
      "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/mpeg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain", "text/csv",
      "image/png", "image/jpeg", "image/webp",
      "application/zip",
    ];
    // Generic/unknown types are accepted only when the extension is a known safe one.
    const allowedExtensions = [
      "mp4", "mov", "webm", "avi", "mpeg", "mpg",
      "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
      "txt", "csv", "zip", "png", "jpg", "jpeg", "webp",
    ];
    const ext = String(fileName).split(".").pop()?.toLowerCase() ?? "";
    const typeOk =
      allowedTypes.includes(effectiveContentType) || allowedExtensions.includes(ext);

    if (!typeOk) {
      console.error("Rejected upload: unsupported type", { fileName, effectiveContentType, ext });
      return new Response(JSON.stringify({ error: `Unsupported file type (${effectiveContentType || ext || "unknown"}). Allowed: video, PDF, Word, PowerPoint, Excel, text, images, zip` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }



    // Validate file size (max 2GB)
    if (fileSize && fileSize > 2 * 1024 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size exceeds 2GB limit" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID")!;
    const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY")!;
    const awsRegion = Deno.env.get("AWS_REGION")!;
    const awsBucket = Deno.env.get("AWS_S3_BUCKET_NAME")!;

    // Build S3 key: prefer explicit pathPrefix, else default to courses/{courseId}/lessons/
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const prefix = (pathPrefix?.replace(/^\/+|\/+$/g, "")) || `courses/${courseId}/lessons`;
    const s3Key = `${prefix}/${Date.now()}-${sanitizedName}`;

    const uploadUrl = await generatePresignedPutUrl(
      awsBucket,
      s3Key,
      awsRegion,
      awsAccessKeyId,
      awsSecretAccessKey,
      effectiveContentType,

      3600 // 1 hour to complete upload
    );

    // The public-style URL that will be stored in the DB as a marker
    const s3Url = `s3://${awsBucket}/${s3Key}`;

    return new Response(JSON.stringify({ uploadUrl, s3Key, s3Url, contentType: effectiveContentType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("s3-get-upload-url error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
