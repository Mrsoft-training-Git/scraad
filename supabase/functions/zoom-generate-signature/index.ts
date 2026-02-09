import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { sessionId, role } = await req.json();
    if (!sessionId) throw new Error("Missing sessionId");

    // Fetch the live session
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: session, error: sessionError } = await serviceClient
      .from("live_sessions")
      .select("zoom_meeting_id, zoom_password")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) throw new Error("Session not found");
    if (!session.zoom_meeting_id) throw new Error("No Zoom meeting associated with this session");

    const sdkKey = Deno.env.get("ZOOM_SDK_KEY")!;
    const sdkSecret = Deno.env.get("ZOOM_SDK_SECRET")!;

    // Generate JWT signature for Zoom Meeting SDK
    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours
    const tokenPayload = {
      sdkKey,
      mn: session.zoom_meeting_id,
      role: role ?? 0,
      iat,
      exp,
      tokenExp: exp,
    };

    // Create JWT using Web Crypto API
    const header = { alg: "HS256", typ: "JWT" };
    const encoder = new TextEncoder();

    const base64url = (data: Uint8Array) => {
      let str = "";
      for (const byte of data) str += String.fromCharCode(byte);
      return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };

    const base64urlEncodeJson = (obj: Record<string, unknown>) =>
      base64url(encoder.encode(JSON.stringify(obj)));

    const headerB64 = base64urlEncodeJson(header);
    const payloadB64 = base64urlEncodeJson(tokenPayload);
    const signingInput = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(sdkSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
    const signatureB64 = base64url(new Uint8Array(signatureBuffer));
    const signature = `${signingInput}.${signatureB64}`;

    return new Response(
      JSON.stringify({
        signature,
        sdkKey,
        meetingNumber: session.zoom_meeting_id,
        password: session.zoom_password || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating signature:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
