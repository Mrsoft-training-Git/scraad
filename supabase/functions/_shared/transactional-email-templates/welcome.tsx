/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, header, brandName, h1, text, muted, button, footer } from './_brand.ts'

interface Props {
  name?: string
  dashboardUrl?: string
}

const Email = ({ name = 'there', dashboardUrl = 'https://scraad011.lovable.app/dashboard' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to ScraAD — your learning journey starts now</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brandName}>ScraAD</Heading>
        </Section>
        <Heading style={h1}>Welcome, {name}!</Heading>
        <Text style={text}>
          We're thrilled to have you on board. ScraAD gives you access to world-class
          courses, professional programs, and live sessions built to help you grow.
        </Text>
        <Text style={text}>
          Head over to your dashboard to explore courses, enroll in programs, and start learning.
        </Text>
        <Section style={{ margin: '24px 0' }}>
          <Button style={button} href={dashboardUrl}>Go to my dashboard</Button>
        </Section>
        <Text style={muted}>
          Need help getting started? Just reply to this email and our team will assist you.
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
  subject: 'Welcome to ScraAD',
  displayName: 'Welcome',
  previewData: { name: 'Jane', dashboardUrl: 'https://scraad011.lovable.app/dashboard' },
} satisfies TemplateEntry
