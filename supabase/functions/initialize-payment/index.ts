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

    const { email, courseId, programId, paymentType, fullName } = await req.json();

    const entityId = courseId || programId;
    const entityType = courseId ? "course" : "program";

    if (!email || !entityId || !paymentType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["full", "first", "second"].includes(paymentType)) {
      return new Response(
        JSON.stringify({ error: "Invalid paymentType. Must be full, first, or second" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let title: string;
    let price: number;
    let allows_part_payment: boolean;
    let first_tranche_amount: number | null;
    let second_tranche_amount: number | null;

    if (entityType === "course") {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, title, price, allows_part_payment, first_tranche_amount, second_tranche_amount")
        .eq("id", entityId)
        .single();

      if (courseError || !course) {
        return new Response(JSON.stringify({ error: "Course not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      title = course.title;
      price = course.price;
      allows_part_payment = course.allows_part_payment;
      first_tranche_amount = course.first_tranche_amount;
      second_tranche_amount = course.second_tranche_amount;
    } else {
      const { data: program, error: programError } = await supabase
        .from("programs")
        .select("id, title, price, allows_part_payment, first_tranche_amount, second_tranche_amount")
        .eq("id", entityId)
        .single();

      if (programError || !program) {
        return new Response(JSON.stringify({ error: "Program not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      title = program.title;
      price = program.price;
      allows_part_payment = program.allows_part_payment;
      first_tranche_amount = program.first_tranche_amount;
      second_tranche_amount = program.second_tranche_amount;
    }

    let amount: number;

    if (paymentType === "full") {
      amount = price;
    } else if (paymentType === "first") {
      if (!allows_part_payment || !first_tranche_amount) {
        return new Response(
          JSON.stringify({ error: "This does not support part payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      amount = first_tranche_amount;
    } else {
      if (!allows_part_payment || !second_tranche_amount) {
        return new Response(
          JSON.stringify({ error: "This does not support part payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      amount = second_tranche_amount;
    }

    const amountInKobo = Math.round(amount * 100);

    const callbackPath = entityType === "course" ? "/dashboard/courses" : "/dashboard/programs";

    const paystackBody: any = {
      email,
      amount: amountInKobo,
      metadata: {
        courseId: courseId || null,
        programId: programId || null,
        entityType,
        paymentType,
        title,
        custom_fields: [
          {
            display_name: "Student Name",
            variable_name: "student_name",
            value: fullName || email,
          },
        ],
      },
      callback_url: `${req.headers.get("origin") || ""}${callbackPath}`,
    };

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackBody),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return new Response(
        JSON.stringify({ error: paystackData.message || "Payment initialization failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
