// Shared helpers for course/program learner notifications.
// Used by `notify-learners` (event-driven) and `send-due-reminders` (scheduled).

export interface Recipient {
  userId: string
  email: string
  name: string
}

const APP_URL = 'https://scraad.com'

export function dashboardUrl(
  entityType: 'program' | 'course',
  entityId: string,
): string {
  return entityType === 'program'
    ? `${APP_URL}/dashboard/programs/${entityId}`
    : `${APP_URL}/dashboard/course/${entityId}`
}

export function formatDate(value?: string | null): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  if (isNaN(d.getTime())) return undefined
  return d.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  })
}

/** Active learners for a program or course, with their profile email. */
export async function getLearners(
  supabase: any,
  entityType: 'program' | 'course',
  entityId: string,
): Promise<Recipient[]> {
  let userIds: string[] = []

  if (entityType === 'program') {
    const { data, error } = await supabase
      .from('program_enrollments')
      .select('user_id, status, access_status')
      .eq('program_id', entityId)
    if (error) throw error
    userIds = (data ?? [])
      .filter(
        (r: any) =>
          r.status !== 'rejected' &&
          r.status !== 'withdrawn' &&
          r.access_status !== 'revoked',
      )
      .map((r: any) => r.user_id)
  } else {
    const { data, error } = await supabase
      .from('enrollments')
      .select('user_id, access_status')
      .eq('course_id', entityId)
    if (error) throw error
    userIds = (data ?? [])
      .filter((r: any) => r.access_status !== 'revoked')
      .map((r: any) => r.user_id)
  }

  userIds = [...new Set(userIds)]
  if (userIds.length === 0) return []

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds)
  if (profileError) throw profileError

  return (profiles ?? [])
    .filter((p: any) => !!p.email)
    .map((p: any) => ({
      userId: p.id,
      email: p.email as string,
      name: (p.full_name as string) || 'there',
    }))
}

/**
 * Enqueue one individually-addressed notification per learner.
 * Each send has its own idempotency key so retries never duplicate.
 */
export async function sendToLearners(
  supabase: any,
  recipients: Recipient[],
  templateName: string,
  keyPrefix: string,
  buildData: (r: Recipient) => Record<string, unknown>,
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const r of recipients) {
    try {
      const { error } = await supabase.functions.invoke(
        'send-transactional-email',
        {
          body: {
            templateName,
            recipientEmail: r.email,
            idempotencyKey: `${keyPrefix}-${r.userId}`,
            templateData: buildData(r),
          },
        },
      )
      if (error) throw error
      sent++
    } catch (err) {
      failed++
      console.error('Notification send failed', {
        templateName,
        userId: r.userId,
        error: String(err),
      })
    }
  }

  return { sent, failed }
}
