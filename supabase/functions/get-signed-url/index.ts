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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to verify identity
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

    const { filePath, bucket } = await req.json();
    if (!filePath || !bucket) {
      return new Response(JSON.stringify({ error: "filePath and bucket required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to check access and generate signed URL
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Extract course_id from file path (first folder segment)
    const courseId = filePath.split("/")[0];

    // Check if user has access: admin, course instructor, or enrolled student
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin";

    if (!isAdmin) {
      // Check if instructor of this course
      const { data: course } = await adminClient
        .from("courses")
        .select("instructor_id")
        .eq("id", courseId)
        .maybeSingle();

      const isInstructor = course?.instructor_id === user.id;

      if (!isInstructor) {
        // Check enrollment
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

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
