/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, styles, Text } from './_layout.tsx'

interface Props {
  name?: string
  kind?: 'assignment' | 'exam'
  itemTitle?: string
  entityTitle?: string
  entityType?: 'program' | 'course'
  dueDate?: string
  hoursLeft?: number
  actionUrl?: string
}

const detailLine = { ...styles.paragraph, margin: '4px 0', fontSize: '14px' }

const Email = ({
  name = 'there',
  kind = 'assignment',
  itemTitle = 'your assignment',
  entityTitle = 'your programme',
  entityType = 'program',
  dueDate,
  hoursLeft,
  actionUrl = 'https://scraad.com/dashboard/learning',
}: Props) => (
  <EmailLayout
    preview={`Reminder: ${itemTitle} is due soon`}
    title={kind === 'exam' ? 'Your exam starts soon' : 'Deadline reminder'}
    greetingName={name}
    message={
      kind === 'exam'
        ? `This is a reminder that an upcoming assessment for your ${entityType}, ${entityTitle}, is about to open.`
        : `This is a friendly reminder that you have an outstanding submission for your ${entityType}, ${entityTitle}.`
    }
    detailsTitle={itemTitle}
    detailsBody={
      <>
        {dueDate && (
          <Text style={detailLine}>
            {kind === 'exam' ? '🗓️ Opens: ' : '⏰ Due: '}
            {dueDate}
          </Text>
        )}
        {hoursLeft ? (
          <Text style={detailLine}>⚡ Time left: about {hoursLeft} hour(s)</Text>
        ) : null}
        {kind === 'assignment' && (
          <Text style={detailLine}>📌 Status: Not submitted yet</Text>
        )}
      </>
    }
    buttonText={kind === 'exam' ? 'View exam' : 'Submit now'}
    actionUrl={actionUrl}
  />
)

export const template = {
  component: Email,
  subject: (d) =>
    d.kind === 'exam'
      ? `Starting soon: ${d.itemTitle ?? 'your exam'}`
      : `Reminder: ${d.itemTitle ?? 'your assignment'} is due soon`,
  displayName: 'Deadline Reminder',
  previewData: {
    name: 'Jane',
    kind: 'assignment',
    itemTitle: 'Threat Modelling Report',
    entityTitle: 'PGD in Cybersecurity',
    dueDate: 'Aug 12, 2026, 5:00 PM',
    hoursLeft: 24,
  },
} satisfies TemplateEntry
