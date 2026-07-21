/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, styles, Text } from './_layout.tsx'

interface Props {
  name?: string
  dashboardUrl?: string
}

const Email = ({
  name = 'there',
  dashboardUrl = 'https://scraad.com/dashboard',
}: Props) => (
  <EmailLayout
    preview="Welcome to ScraAD — your learning journey starts now"
    title="Welcome to ScraAD 🎉"
    greetingName={name}
    message={
      <>
        <Text style={styles.paragraph}>
          We're thrilled to have you on board. ScraAD gives you access to world-class
          courses, professional programs, and live sessions built to help you grow
          from scratch to advance.
        </Text>
        <Text style={styles.paragraph}>
          Head over to your dashboard to explore courses, enroll in programs, and start learning.
        </Text>
      </>
    }
    buttonText="Go to my dashboard"
    actionUrl={dashboardUrl}
  />
)

export const template = {
  component: Email,
  subject: 'Welcome to ScraAD',
  displayName: 'Welcome',
  previewData: { name: 'Jane', dashboardUrl: 'https://scraad.com/dashboard' },
} satisfies TemplateEntry
