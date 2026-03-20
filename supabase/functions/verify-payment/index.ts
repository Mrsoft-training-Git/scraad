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
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Payment not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return new Response(JSON.stringify({ error: "Payment not successful", verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txData = verifyData.data;
    const email = txData.customer?.email;
    const metadata = txData.metadata || {};
    const courseId = metadata.courseId;
    const programId = metadata.programId;
    const paymentType = metadata.paymentType;
    const entityType = metadata.entityType || (courseId ? "course" : "program");

    if ((!courseId && !programId) || !paymentType || !email) {
      return new Response(JSON.stringify({ error: "Missing metadata in transaction", verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found", verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const now = new Date().toISOString();

    if (entityType === "program" && programId) {
      const { data: program } = await supabase
        .from("programs")
        .select("id, title, second_payment_due_days")
        .eq("id", programId)
        .single();

      const { data: existing } = await supabase
        .from("program_enrollments")
        .select("*")
        .eq("user_id", userId)
        .eq("program_id", programId)
        .maybeSingle();

      if (!existing) {
        return new Response(JSON.stringify({ error: "Enrollment not found", verified: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (paymentType === "full") {
        if (existing.payment_status !== "paid") {
          await supabase.from("program_enrollments").update({
            payment_status: "paid", access_status: "active", first_payment_date: now,
          }).eq("id", existing.id);
        }
      } else if (paymentType === "first") {
        if (existing.payment_status !== "partial" && existing.payment_status !== "paid") {
          const dueDays = program?.second_payment_due_days || 30;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + dueDays);
          await supabase.from("program_enrollments").update({
            payment_status: "partial", access_status: "active", first_payment_date: now,
            second_payment_due_date: dueDate.toISOString(),
          }).eq("id", existing.id);
        }
      } else if (paymentType === "second") {
        if (existing.payment_status !== "paid") {
          await supabase.from("program_enrollments").update({
            payment_status: "paid", access_status: "active", second_payment_date: now,
          }).eq("id", existing.id);
        }
      }

      return new Response(JSON.stringify({ verified: true, entityType: "program", programId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Course payment
    if (courseId) {
      const { data: course } = await supabase
        .from("courses")
        .select("id, title, second_payment_due_days")
        .eq("id", courseId)
        .single();

      const { data: existing } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (paymentType === "full") {
        if (!existing || existing.payment_status !== "paid") {
          await supabase.from("enrollments").upsert(
            { user_id: userId, course_id: courseId, payment_status: "paid", access_status: "active", first_payment_date: now },
            { onConflict: "user_id,course_id" }
          );
        }
      } else if (paymentType === "first") {
        if (!existing || (existing.payment_status !== "partial" && existing.payment_status !== "paid")) {
          const dueDays = course?.second_payment_due_days || 30;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + dueDays);
          await supabase.from("enrollments").upsert(
            { user_id: userId, course_id: courseId, payment_status: "partial", access_status: "active", first_payment_date: now, second_payment_due_date: dueDate.toISOString() },
            { onConflict: "user_id,course_id" }
          );
        }
      } else if (paymentType === "second") {
        if (!existing || existing.payment_status !== "paid") {
          await supabase.from("enrollments").upsert(
            { user_id: userId, course_id: courseId, payment_status: "paid", access_status: "active", second_payment_date: now },
            { onConflict: "user_id,course_id" }
          );
        }
      }

      // Ensure enrolled_courses entry
      const { data: enrolledCheck } = await supabase
        .from("enrolled_courses")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (!enrolledCheck && course) {
        await supabase.from("enrolled_courses").insert({
          user_id: userId, course_id: courseId, course_name: course.title, progress: 0,
        });
        await supabase.rpc("increment_students_count", { course_id_input: courseId });
      }

      return new Response(JSON.stringify({ verified: true, entityType: "course", courseId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown entity", verified: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
