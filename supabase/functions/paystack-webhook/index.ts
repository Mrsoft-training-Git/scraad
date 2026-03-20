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
      return new Response("Not configured", { status: 500 });
    }

    const body = await req.text();

    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    const encoder = new TextEncoder();
    const key = encoder.encode(PAYSTACK_SECRET_KEY);
    const data = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const hash = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hash !== signature) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return new Response("OK", { status: 200 });
    }

    const { customer: { email }, metadata } = event.data;

    const courseId = metadata?.courseId;
    const programId = metadata?.programId;
    const paymentType = metadata?.paymentType;
    const entityType = metadata?.entityType || (courseId ? "course" : "program");

    if ((!courseId && !programId) || !paymentType || !email) {
      console.error("Missing metadata in webhook:", { courseId, programId, paymentType, email });
      return new Response("Missing metadata", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      console.error("User not found for email:", email);
      return new Response("User not found", { status: 404 });
    }

    const userId = user.id;
    const now = new Date().toISOString();

    if (entityType === "program" && programId) {
      return await handleProgramPayment(supabase, userId, programId, paymentType, now);
    }

    // Course payment (existing logic)
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
      if (existing?.payment_status === "paid") {
        return new Response("Already paid", { status: 200 });
      }
      await supabase.from("enrollments").upsert(
        { user_id: userId, course_id: courseId, payment_status: "paid", access_status: "active", first_payment_date: now },
        { onConflict: "user_id,course_id" }
      );
    } else if (paymentType === "first") {
      if (existing?.payment_status === "partial" || existing?.payment_status === "paid") {
        return new Response("Already processed", { status: 200 });
      }
      const dueDays = course?.second_payment_due_days || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);
      await supabase.from("enrollments").upsert(
        { user_id: userId, course_id: courseId, payment_status: "partial", access_status: "active", first_payment_date: now, second_payment_due_date: dueDate.toISOString() },
        { onConflict: "user_id,course_id" }
      );
    } else if (paymentType === "second") {
      if (existing?.payment_status === "paid") {
        return new Response("Already fully paid", { status: 200 });
      }
      await supabase.from("enrollments").upsert(
        { user_id: userId, course_id: courseId, payment_status: "paid", access_status: "active", second_payment_date: now },
        { onConflict: "user_id,course_id" }
      );
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

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal error", { status: 500 });
  }
});

async function handleProgramPayment(supabase: any, userId: string, programId: string, paymentType: string, now: string) {
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
    console.error("No program enrollment found for user:", userId, "program:", programId);
    return new Response("Enrollment not found", { status: 404 });
  }

  if (paymentType === "full") {
    if (existing.payment_status === "paid") {
      return new Response("Already paid", { status: 200 });
    }
    await supabase.from("program_enrollments").update({
      payment_status: "paid", access_status: "active", first_payment_date: now,
    }).eq("id", existing.id);
  } else if (paymentType === "first") {
    if (existing.payment_status === "partial" || existing.payment_status === "paid") {
      return new Response("Already processed", { status: 200 });
    }
    const dueDays = program?.second_payment_due_days || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);
    await supabase.from("program_enrollments").update({
      payment_status: "partial", access_status: "active", first_payment_date: now, second_payment_due_date: dueDate.toISOString(),
    }).eq("id", existing.id);
  } else if (paymentType === "second") {
    if (existing.payment_status === "paid") {
      return new Response("Already fully paid", { status: 200 });
    }
    await supabase.from("program_enrollments").update({
      payment_status: "paid", access_status: "active", second_payment_date: now,
    }).eq("id", existing.id);
  }

  return new Response("OK", { status: 200 });
}
