import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      program_id, email, full_name, phone, age, gender, country, address,
      guardian_name, guardian_phone, guardian_email, guardian_relationship,
      guardians, motivation, send_invite = true,
    } = body ?? {};

    type G = { name?: string; phone?: string; email?: string; relationship?: string; gender?: string };
    const guardianList: G[] = Array.isArray(guardians) && guardians.length
      ? guardians.slice(0, 3)
      : (guardian_name || guardian_phone || guardian_email || guardian_relationship
        ? [{ name: guardian_name, phone: guardian_phone, email: guardian_email, relationship: guardian_relationship }]
        : []);
    const primaryGuardian = guardianList[0] ?? {};
    const extraGuardians = guardianList.slice(1);


    if (!program_id || !email || !full_name) {
      return new Response(JSON.stringify({ error: "program_id, email and full_name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contactEmail = String(email).trim().toLowerCase();
    const redirectTo = (body.redirect_to as string) || undefined;
    const [localPart, domainPart] = contactEmail.split("@");
    const nameKey = String(full_name).trim().toLowerCase().replace(/\s+/g, " ");

    // A parent may enroll several children using the same contact inbox.
    // Each participant becomes a separate account: the first uses the plain
    // address, subsequent ones get a plus-alias (parent+2@..., parent+3@...)
    // which still delivers to the same inbox but is a distinct identity.
    const { data: sameInbox } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .or(`email.eq.${contactEmail},email.like.${localPart}+%@${domainPart}`);

    let targetUserId: string | null = null;
    let loginEmail = contactEmail;

    const existingSamePerson = (sameInbox ?? []).find(
      (p) => (p.full_name ?? "").trim().toLowerCase().replace(/\s+/g, " ") === nameKey,
    );

    if (existingSamePerson) {
      targetUserId = existingSamePerson.id;
      loginEmail = (existingSamePerson.email ?? contactEmail).toLowerCase();
    } else {
      const taken = new Set((sameInbox ?? []).map((p) => (p.email ?? "").toLowerCase()));
      if (taken.has(contactEmail)) {
        let n = 2;
        while (taken.has(`${localPart}+${n}@${domainPart}`)) n++;
        loginEmail = `${localPart}+${n}@${domainPart}`;
      }
    }

    let invited = false;
    if (!targetUserId) {
      // Try invite
      if (send_invite) {
        const { data: invData, error: invErr } = await admin.auth.admin.inviteUserByEmail(loginEmail, {
          data: { full_name },
          redirectTo,
        });
        if (invErr) {
          // If already registered, look them up
          const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
          const found = list?.users.find(u => (u.email ?? "").toLowerCase() === loginEmail);
          if (found) targetUserId = found.id;
          else throw invErr;
        } else if (invData?.user) {
          targetUserId = invData.user.id;
          invited = true;
        }
      } else {
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email: loginEmail, email_confirm: true, user_metadata: { full_name },
        });
        if (cErr) throw cErr;
        targetUserId = created.user!.id;
      }
    }

    if (!targetUserId) throw new Error("Could not resolve target user");
    const normalizedEmail = loginEmail;

    // Upsert profile fields
    await admin.from("profiles").upsert({
      id: targetUserId,
      full_name,
      email: normalizedEmail,
      phone: phone ?? null,
      country: country ?? null,
      gender: gender ?? null,
      date_of_birth: null,
    }, { onConflict: "id" });

    // Upsert application (approved)
    const { data: existingApp } = await admin
      .from("program_applications").select("id")
      .eq("program_id", program_id).eq("user_id", targetUserId).maybeSingle();

    const appPayload: Record<string, unknown> = {
      program_id, user_id: targetUserId, full_name, email: contactEmail,
      phone: phone ?? null, age: age ?? null, address: address ?? null, gender: gender ?? null,
      guardian_name: primaryGuardian.name ?? null, guardian_phone: primaryGuardian.phone ?? null,
      guardian_email: primaryGuardian.email ?? null, guardian_relationship: primaryGuardian.relationship ?? null,
      guardian_gender: primaryGuardian.gender ?? null,
      additional_guardians: extraGuardians,
      motivation: motivation ?? null,
      status: "approved", reviewed_by: userData.user.id, reviewed_at: new Date().toISOString(),
    };
    if (existingApp) {
      await admin.from("program_applications").update(appPayload).eq("id", existingApp.id);
    } else {
      await admin.from("program_applications").insert(appPayload);
    }

    // Upsert enrollment (paid + active)
    const { data: existingEnroll } = await admin
      .from("program_enrollments").select("id")
      .eq("program_id", program_id).eq("user_id", targetUserId).maybeSingle();

    const enrollPayload = {
      program_id, user_id: targetUserId,
      status: "active", payment_status: "paid", access_status: "active",
      first_payment_date: new Date().toISOString(),
    };
    if (existingEnroll) {
      await admin.from("program_enrollments").update(enrollPayload).eq("id", existingEnroll.id);
    } else {
      await admin.from("program_enrollments").insert(enrollPayload);
    }

    // Fetch program title for email context
    const { data: prog } = await admin
      .from("programs").select("title, mode, start_date").eq("id", program_id).maybeSingle();

    // Send enrollment confirmation email (non-blocking)
    admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "enrollment-confirmation",
        recipientEmail: contactEmail,
        idempotencyKey: `enroll-program-${targetUserId}-${program_id}`,
        templateData: {
          name: full_name,
          programTitle: prog?.title ?? "your program",
          entityType: "program",
          mode: prog?.mode ?? undefined,
          startDate: prog?.start_date
            ? new Date(prog.start_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
            : undefined,
        },
      },
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true, user_id: targetUserId, invited, login_email: loginEmail }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("admin-manual-enroll error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
