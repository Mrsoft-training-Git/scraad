import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import {
  dashboardUrl,
  formatDate,
  getLearners,
  sendToLearners,
} from '../_shared/learning-notifications.ts'

const KINDS = ['assignment', 'material', 'exam', 'upload', 'announcement']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // --- Authenticate caller -------------------------------------------------
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData } = await userClient.auth.getUser()
  const user = userData?.user
  if (!user) return json({ error: 'Unauthorized' }, 401)

  // --- Validate input ------------------------------------------------------
  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const entityType = body.entityType
  const entityId = body.entityId
  const kind = body.kind
  const itemId = String(body.itemId ?? crypto.randomUUID())
  const itemTitle = String(body.itemTitle ?? '').trim()

  if (entityType !== 'program' && entityType !== 'course') {
    return json({ error: 'entityType must be "program" or "course"' }, 400)
  }
  if (typeof entityId !== 'string' || entityId.length < 10) {
    return json({ error: 'entityId is required' }, 400)
  }
  if (!KINDS.includes(kind)) {
    return json({ error: `kind must be one of ${KINDS.join(', ')}` }, 400)
  }
  if (!itemTitle || itemTitle.length > 255) {
    return json({ error: 'itemTitle is required (max 255 chars)' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // --- Authorize: admin, or the instructor who owns the entity -------------
  const { data: isAdmin } = await admin.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin',
  })

  const table = entityType === 'program' ? 'programs' : 'courses'
  const { data: entity, error: entityError } = await admin
    .from(table)
    .select('id, title, instructor_id')
    .eq('id', entityId)
    .maybeSingle()

  if (entityError || !entity) return json({ error: 'Entity not found' }, 404)
  if (!isAdmin && entity.instructor_id !== user.id) {
    return json({ error: 'Forbidden' }, 403)
  }

  // --- Fan out one addressed email per enrolled learner --------------------
  const learners = await getLearners(admin, entityType, entityId)
  if (learners.length === 0) {
    return json({ success: true, sent: 0, failed: 0, recipients: 0 })
  }

  const templateData = {
    kind,
    itemTitle,
    entityTitle: entity.title,
    entityType,
    moduleTitle: body.moduleTitle ? String(body.moduleTitle).slice(0, 200) : undefined,
    description: body.description ? String(body.description).slice(0, 300) : undefined,
    dueDate: formatDate(body.dueDate),
    startTime: formatDate(body.startTime),
    durationMinutes:
      typeof body.durationMinutes === 'number' ? body.durationMinutes : undefined,
    maxScore: typeof body.maxScore === 'number' ? body.maxScore : undefined,
    actionUrl: dashboardUrl(entityType, entityId),
  }

  const result = await sendToLearners(
    admin,
    learners,
    'learning-update',
    `${kind}-${itemId}`,
    (r) => ({ ...templateData, name: r.name }),
  )

  console.log('notify-learners complete', { kind, entityType, entityId, ...result })
  return json({ success: true, recipients: learners.length, ...result })
})
