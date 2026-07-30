import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import {
  dashboardUrl,
  formatDate,
  getLearners,
  sendToLearners,
  type Recipient,
} from '../_shared/learning-notifications.ts'

// Scheduled hourly. Sends a single reminder per learner per item when the
// deadline (or exam start) falls in the 24h-from-now window.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = Date.now()
  const windowStart = new Date(now + 23 * 3600 * 1000).toISOString()
  const windowEnd = new Date(now + 24 * 3600 * 1000).toISOString()

  const summary = { assignments: 0, exams: 0, sent: 0, failed: 0 }

  const notify = async (
    recipients: Recipient[],
    keyPrefix: string,
    data: Record<string, unknown>,
  ) => {
    if (recipients.length === 0) return
    const res = await sendToLearners(
      supabase,
      recipients,
      'deadline-reminder',
      keyPrefix,
      (r) => ({ ...data, name: r.name }),
    )
    summary.sent += res.sent
    summary.failed += res.failed
  }

  try {
    // 1. Program assignments due in ~24h
    const { data: programAssignments } = await supabase
      .from('program_assignments')
      .select('id, title, due_date, program_id, programs(title)')
      .eq('is_published', true)
      .gte('due_date', windowStart)
      .lt('due_date', windowEnd)

    for (const a of programAssignments ?? []) {
      const learners = await getLearners(supabase, 'program', a.program_id)
      const { data: submissions } = await supabase
        .from('program_submissions')
        .select('user_id')
        .eq('assignment_id', a.id)
      const done = new Set((submissions ?? []).map((s: any) => s.user_id))
      const pending = learners.filter((l) => !done.has(l.userId))
      summary.assignments++
      await notify(pending, `reminder-passign-${a.id}`, {
        kind: 'assignment',
        itemTitle: a.title,
        entityTitle: (a as any).programs?.title ?? 'your programme',
        entityType: 'program',
        dueDate: formatDate(a.due_date),
        hoursLeft: 24,
        actionUrl: dashboardUrl('program', a.program_id),
      })
    }

    // 2. Course assignments due in ~24h
    const { data: courseAssignments } = await supabase
      .from('course_assignments')
      .select('id, title, due_date, course_id, courses(title)')
      .eq('is_published', true)
      .gte('due_date', windowStart)
      .lt('due_date', windowEnd)

    for (const a of courseAssignments ?? []) {
      const learners = await getLearners(supabase, 'course', a.course_id)
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('student_id')
        .eq('assignment_id', a.id)
      const done = new Set((submissions ?? []).map((s: any) => s.student_id))
      const pending = learners.filter((l) => !done.has(l.userId))
      summary.assignments++
      await notify(pending, `reminder-cassign-${a.id}`, {
        kind: 'assignment',
        itemTitle: a.title,
        entityTitle: (a as any).courses?.title ?? 'your course',
        entityType: 'course',
        dueDate: formatDate(a.due_date),
        hoursLeft: 24,
        actionUrl: dashboardUrl('course', a.course_id),
      })
    }

    // 3. Exams starting in ~24h
    const { data: exams } = await supabase
      .from('cbt_exams')
      .select('id, title, start_time, exam_type, course_id, program_id')
      .eq('is_published', true)
      .gte('start_time', windowStart)
      .lt('start_time', windowEnd)

    for (const e of exams ?? []) {
      const entityType: 'program' | 'course' =
        e.exam_type === 'program' ? 'program' : 'course'
      const entityId = entityType === 'program' ? e.program_id : e.course_id
      if (!entityId) continue
      const learners = await getLearners(supabase, entityType, entityId)
      const table = entityType === 'program' ? 'programs' : 'courses'
      const { data: entity } = await supabase
        .from(table)
        .select('title')
        .eq('id', entityId)
        .maybeSingle()
      summary.exams++
      await notify(learners, `reminder-exam-${e.id}`, {
        kind: 'exam',
        itemTitle: e.title,
        entityTitle: entity?.title ?? 'your programme',
        entityType,
        dueDate: formatDate(e.start_time),
        hoursLeft: 24,
        actionUrl: `https://scraad.com/dashboard/cbt/${e.id}`,
      })
    }
  } catch (err) {
    console.error('send-due-reminders failed', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  console.log('send-due-reminders complete', summary)
  return new Response(JSON.stringify({ success: true, ...summary }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
