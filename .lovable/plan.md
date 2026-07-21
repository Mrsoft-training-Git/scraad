
# Branded Emails via Lovable Emails (Phase 1)

Keep Lovable Cloud auth as-is. Use Lovable's built-in email system (managed SMTP + queue + templates) for all auth and app emails. No Resend, no third-party API keys.

## What ships in this phase

1. **Email domain setup** — you configure a sender subdomain (e.g. `notify.scraad.com`) through the in-app email setup dialog. Lovable manages DNS via NS delegation. Templates can be scaffolded and code deployed while DNS verifies.
2. **Email infrastructure** — pgmq queues, send log, suppression list, unsubscribe tokens, and the `process-email-queue` worker are provisioned automatically.
3. **Branded auth email templates** (all 6: signup, magic-link, recovery, invite, email-change, reauthentication) — styled with ScraAD navy #0B3C5D, gold #E8963A, DM Sans/Inter, MRsoft footer, matching your product tone. Password reset and verification links come from your own domain.
4. **Branded app email templates** for:
   - `welcome` — after email verification / first login.
   - `course-enrollment` — student name, course title, instructor, start date, dashboard link.
   - `program-enrollment` — program title, track, duration, schedule, dashboard link. Also fires the admission-letter style summary.
   - `payment-receipt` — Paystack reference, amount, course/program, date, part-payment status, next-due date if applicable. HTML invoice inline (no PDF attachment in this phase).
5. **Trigger wiring** (each call is idempotent via a per-event key):
   - Welcome: fired once after first successful sign-in.
   - Course enrollment: from `useEnrollment.ts` free path and from `paystack-webhook` on first paid enrollment.
   - Program enrollment: from `ProgramApplicationForm.tsx` after enrollment insert, and from `admin-manual-enroll`.
   - Payment receipt: from `paystack-webhook` on every successful `charge.success` (course and program, full/first/second).
6. **Unsubscribe page** at the scaffolded path — branded confirm/success screen (required so email footer links land in your app, not a raw function URL). Auth emails are exempt from unsubscribe by design.

## What is NOT in this phase (deferred, per your earlier answer)

- 2FA (TOTP / email OTP)
- Login-alert emails (new device / IP / location)
- Keycloak migration
- Marketing / bulk email (not supported by Lovable Emails on purpose)
- PDF invoice attachment

## User action required (one step)

Complete the email setup dialog to pick your sender subdomain and add the NS records at your DNS provider. Everything else — templates, queue, cron, unsubscribe function — is created and deployed automatically. Sending activates the moment DNS verifies; until then, default Lovable auth emails continue and app-email calls queue.

## Technical notes (for reference)

- Templates live in `supabase/functions/_shared/email-templates/` (auth) and `supabase/functions/_shared/transactional-email-templates/` (app), as React-Email `.tsx` components.
- One `send-transactional-email` edge function handles all app-email types via `templateName` + `templateData`. No per-email edge function.
- `auth-email-hook` routes Supabase Auth events into the `auth_emails` pgmq queue.
- Idempotency keys derived from event ids: `enroll-course-{enrollmentId}`, `enroll-program-{enrollmentId}`, `receipt-{paystackReference}`.
- No schema changes to your existing tables; only the managed email tables (`email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`) are added by infra setup.
- Body background stays `#ffffff` per email best practices; brand navy/gold are used for headings, buttons, and accents.

Ready to build once you approve.
