import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This can be called without auth header — the state param contains the JWT
    let code: string;
    let userToken: string;

    if (req.method === "GET") {
      // Direct browser redirect from Zoom
      const url = new URL(req.url);
      code = url.searchParams.get("code") || "";
      userToken = url.searchParams.get("state") || "";
    } else {
      const body = await req.json();
      code = body.code || "";
      userToken = body.state || "";
    }

    if (!code || !userToken) {
      return new Response(JSON.stringify({ error: "Missing code or state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the user token from state
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${userToken}` } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(userToken);
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid state token:", claimsError);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const clientId = Deno.env.get("ZOOM_OAUTH_CLIENT_ID")!;
    const clientSecret = Deno.env.get("ZOOM_OAUTH_CLIENT_SECRET")!;
    const redirectUrl = Deno.env.get("ZOOM_OAUTH_REDIRECT_URL")!;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUrl,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Zoom token exchange failed:", tokenData);
      return new Response(JSON.stringify({ error: "Token exchange failed", details: tokenData }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Zoom user info
    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const zoomUser = await userResponse.json();

    // Store connection using service role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    const { error: upsertError } = await serviceClient
      .from("zoom_connections")
      .upsert(
        {
          user_id: userId,
          zoom_access_token: tokenData.access_token,
          zoom_refresh_token: tokenData.refresh_token,
          zoom_expires_at: expiresAt,
          zoom_user_id: zoomUser.id,
          zoom_email: zoomUser.email,
          is_connected: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to save connection" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
