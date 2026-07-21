/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, header, brandName, h1, text, muted, button, card, footer, brand } from './_brand.ts'

interface Props {
  name?: string
  programTitle?: string
  entityType?: 'program' | 'course'
  startDate?: string
  mode?: string
  dashboardUrl?: string
}

const Email = ({
  name = 'there',
  programTitle = 'your program',
  entityType = 'program',
  startDate,
  mode,
  dashboardUrl = 'https://scraad011.lovable.app/dashboard/learning',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're enrolled in {programTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brandName}>ScraAD</Heading>
        </Section>
        <Heading style={h1}>You're in, {name} 🎉</Heading>
        <Text style={text}>
          Your enrollment for the {entityType} below has been confirmed.
        </Text>
        <Section style={card}>
          <Text style={{ ...text, fontWeight: 700, color: brand.navy, margin: '0 0 8px' }}>
            {programTitle}
          </Text>
          {startDate && (
            <Text style={{ ...muted, margin: '0 0 4px' }}>Starts: {startDate}</Text>
          )}
          {mode && (
            <Text style={{ ...muted, margin: 0 }}>Mode: {mode}</Text>
          )}
        </Section>
        <Text style={text}>
          Visit your learning dashboard to access materials, live sessions, and updates.
        </Text>
        <Section style={{ margin: '24px 0' }}>
          <Button style={button} href={dashboardUrl}>Open my dashboard</Button>
        </Section>
        <Text style={muted}>
          If any details look incorrect, reply to this email and we'll sort it out.
        </Text>
        <Text style={footer}>
          © ScraAD · Powered by M-R International
        </Text>
      </Container>
    </Body>
  </Html>
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
