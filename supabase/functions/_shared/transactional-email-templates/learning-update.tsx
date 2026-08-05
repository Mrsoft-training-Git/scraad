/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, styles, Text } from './_layout.tsx'

type Kind = 'assignment' | 'material' | 'exam' | 'upload' | 'announcement'

interface Props {
  name?: string
  kind?: Kind
  itemTitle?: string
  entityTitle?: string
  entityType?: 'program' | 'course'
  moduleTitle?: string
  description?: string
  dueDate?: string
  startTime?: string
  durationMinutes?: number
  maxScore?: number
  actionUrl?: string
}

const detailLine = { ...styles.paragraph, margin: '4px 0', fontSize: '14px' }

const COPY: Record<Kind, { heading: string; lead: string; cta: string }> = {
  assignment: {
    heading: 'New assignment posted',
    lead: 'A new assignment has just been published. Please review the details and submit before the deadline.',
    cta: 'View assignment',
  },
  material: {
    heading: 'New learning material available',
    lead: 'A new learning resource has been added to your course materials.',
    cta: 'Open material',
  },
  exam: {
    heading: 'An exam has been scheduled',
    lead: 'An assessment has been scheduled for you. Make sure you are ready before it opens.',
    cta: 'View exam details',
  },
  upload: {
    heading: 'New document uploaded',
    lead: 'A new document has been uploaded to your learning area.',
    cta: 'View document',
  },
  announcement: {
    heading: 'New update posted',
    lead: 'There is a new update in your learning area.',
    cta: 'Open dashboard',
  },
}

const Email = ({
  name = 'there',
  kind = 'material',
  itemTitle = 'New item',
  entityTitle = 'your programme',
  entityType = 'program',
  moduleTitle,
  description,
  dueDate,
  startTime,
  durationMinutes,
  maxScore,
  actionUrl = 'https://scraad.com/dashboard/learning',
}: Props) => {
  const copy = COPY[kind] ?? COPY.announcement
  return (
    <EmailLayout
      preview={`${copy.heading}: ${itemTitle}`}
      title={copy.heading}
      greetingName={name}
      message={`${copy.lead} This relates to your ${entityType}, ${entityTitle}.`}
      detailsTitle={itemTitle}
      detailsBody={
        <>
          {moduleTitle && <Text style={detailLine}>Module: {moduleTitle}</Text>}
          {description && <Text style={detailLine}>{description}</Text>}
          {dueDate && <Text style={detailLine}>Due: {dueDate}</Text>}
          {startTime && <Text style={detailLine}>Opens: {startTime}</Text>}
          {durationMinutes ? (
            <Text style={detailLine}>Duration: {durationMinutes} minutes</Text>
          ) : null}
          {maxScore ? <Text style={detailLine}>Max score: {maxScore}</Text> : null}
        </>
      }
      buttonText={copy.cta}
      actionUrl={actionUrl}
    />
  )
}

export const template = {
  component: Email,
  subject: (d) => {
    const kind: Kind = d.kind ?? 'announcement'
    const item = d.itemTitle ?? 'New update'
    const entity = d.entityTitle ? ` — ${d.entityTitle}` : ''
    const prefix =
      kind === 'assignment'
        ? 'New assignment'
        : kind === 'exam'
        ? 'Exam scheduled'
        : kind === 'material'
        ? 'New material'
        : kind === 'upload'
        ? 'New document'
        : 'New update'
    return `${prefix}: ${item}${entity}`
  },
  displayName: 'Learning Update',
  previewData: {
    name: 'Jane',
    kind: 'assignment',
    itemTitle: 'Threat Modelling Report',
    entityTitle: 'PGD in Cybersecurity',
    entityType: 'program',
    moduleTitle: 'Week 3 — Risk Analysis',
    dueDate: 'Aug 12, 2026, 5:00 PM',
    maxScore: 100,
  },
} satisfies TemplateEntry
