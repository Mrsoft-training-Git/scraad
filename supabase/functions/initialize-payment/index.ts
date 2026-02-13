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

    const { email, courseId, paymentType, fullName } = await req.json();

    if (!email || !courseId || !paymentType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, courseId, paymentType" }),
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

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price, allows_part_payment, first_tranche_amount, second_tranche_amount")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let amount: number;

    if (paymentType === "full") {
      amount = course.price;
    } else if (paymentType === "first") {
      if (!course.allows_part_payment || !course.first_tranche_amount) {
        return new Response(
          JSON.stringify({ error: "This course does not support part payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      amount = course.first_tranche_amount;
    } else {
      if (!course.allows_part_payment || !course.second_tranche_amount) {
        return new Response(
          JSON.stringify({ error: "This course does not support part payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      amount = course.second_tranche_amount;
    }

    // Paystack expects amount in kobo (smallest unit)
    const amountInKobo = Math.round(amount * 100);

    const paystackBody: any = {
      email,
      amount: amountInKobo,
      metadata: {
        courseId,
        paymentType,
        courseTitle: course.title,
        custom_fields: [
          {
            display_name: "Student Name",
            variable_name: "student_name",
            value: fullName || email,
          },
        ],
      },
      callback_url: `${req.headers.get("origin") || ""}/dashboard/courses`,
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
