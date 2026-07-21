/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, styles, Text } from './_layout.tsx'

interface Props {
  name?: string
  programTitle?: string
  entityType?: 'program' | 'course'
  startDate?: string
  mode?: string
  dashboardUrl?: string
}

const detailLine = { ...styles.paragraph, margin: '4px 0', fontSize: '14px' }

const Email = ({
  name = 'there',
  programTitle = 'your program',
  entityType = 'program',
  startDate,
  mode,
  dashboardUrl = 'https://scraad.com/dashboard/learning',
}: Props) => (
  <EmailLayout
    preview={`You're enrolled in ${programTitle}`}
    title={`You're in, ${name} 🎉`}
    greetingName={name}
    message={`Your enrollment for the ${entityType} below has been confirmed. Below are the details:`}
    detailsTitle={programTitle}
    detailsBody={
      <>
        {startDate && <Text style={detailLine}>📅 Starts: {startDate}</Text>}
        {mode && <Text style={detailLine}>📍 Mode: {mode}</Text>}
        <Text style={detailLine}>✅ Status: Confirmed</Text>
      </>
    }
    buttonText="Open my dashboard"
    actionUrl={dashboardUrl}
    postButton={
      <Text style={{ ...styles.paragraph, fontSize: '13px', color: styles.brand.muted }}>
        If any details look incorrect, reply to this email and we'll sort it out.
      </Text>
    }
  />
)

export const template = {
  component: Email,
  subject: (d) => `Enrollment confirmed: ${d.programTitle ?? 'your program'}`,
  displayName: 'Enrollment Confirmation',
  previewData: {
    name: 'Jane',
    programTitle: 'PGD in Cybersecurity',
    entityType: 'program',
    startDate: 'Aug 3, 2026',
    mode: 'Hybrid',
  },
} satisfies TemplateEntry
