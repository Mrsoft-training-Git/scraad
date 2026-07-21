/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Button, Link, Hr,
} from 'npm:@react-email/components@0.0.22'

export const brand = {
  navy: '#0B3C5D',
  navyDark: '#0a2f47',
  gold: '#E8963A',
  ink: '#1a1a1a',
  muted: '#55575d',
  soft: '#f6f8fb',
  border: '#e5e7eb',
}

const LOGO_URL =
  'https://www.scraad.com/__l5e/assets-v1/14345a7e-fd3c-49f0-a756-885891cc3e10/scraad-email-logo.png'
const MRSOFT_LOGO_URL =
  'https://www.scraad.com/__l5e/assets-v1/def2fe0a-0a1c-4caa-9f6a-68cdb4345611/mrsoft-logo.jpeg'

const main = {
  backgroundColor: '#f4f6fa',
  fontFamily: "'Inter', Arial, sans-serif",
  margin: 0,
  padding: '24px 0',
}
const outer = { maxWidth: '600px', margin: '0 auto', padding: '0 16px' }
const card = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden' as const,
  border: `1px solid ${brand.border}`,
  boxShadow: '0 1px 3px rgba(11,60,93,0.06)',
}
const header = {
  backgroundColor: '#ffffff',
  padding: '24px 28px 20px',
  borderBottom: `3px solid ${brand.gold}`,
  textAlign: 'center' as const,
}
const logoStyle = { height: '40px', width: 'auto', margin: '0 auto', display: 'block' }
const content = { padding: '32px 32px 24px' }
const title = {
  fontSize: '22px',
  fontWeight: 700 as const,
  color: brand.navy,
  margin: '0 0 16px',
  lineHeight: '1.3',
}
const paragraph = {
  fontSize: '15px',
  color: brand.ink,
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const detailsBox = {
  backgroundColor: brand.soft,
  border: `1px solid ${brand.border}`,
  borderLeft: `4px solid ${brand.gold}`,
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '20px 0',
}
const programName = {
  fontSize: '16px',
  fontWeight: 700 as const,
  color: brand.navy,
  margin: '0 0 8px',
}
const buttonWrap = { textAlign: 'center' as const, margin: '28px 0 20px' }
const btn = {
  backgroundColor: brand.navy,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '8px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const fallback = {
  fontSize: '12px',
  color: brand.muted,
  lineHeight: '1.5',
  margin: '0 0 6px',
  textAlign: 'center' as const,
}
const linkText = {
  fontSize: '12px',
  color: brand.navy,
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
  margin: '0 0 8px',
  display: 'block',
}
const footer = {
  backgroundColor: brand.navy,
  color: '#ffffff',
  padding: '28px 32px',
  textAlign: 'center' as const,
}
const footerBrand = {
  fontSize: '18px',
  fontWeight: 700 as const,
  color: '#ffffff',
  margin: '0 0 4px',
  letterSpacing: '0.5px',
}
const footerTag = {
  fontSize: '11px',
  color: brand.gold,
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 4px',
}
const footerSub = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.7)',
  margin: '0 0 14px',
}
const footerContact = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.85)',
  margin: '2px 0',
}
const footerLink = { color: brand.gold, textDecoration: 'none' }
const copyright = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.5)',
  margin: '16px 0 0',
  paddingTop: '14px',
  borderTop: '1px solid rgba(255,255,255,0.15)',
}

interface Props {
  preview: string
  title: string
  greetingName?: string
  message: React.ReactNode
  detailsTitle?: string
  detailsBody?: React.ReactNode
  buttonText?: string
  actionUrl?: string
  postButton?: React.ReactNode
}

export const EmailLayout = ({
  preview,
  title: titleText,
  greetingName,
  message,
  detailsTitle,
  detailsBody,
  buttonText,
  actionUrl,
  postButton,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={card}>
          <Section style={header}>
            <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '0 auto' }}>
              <tr>
                <td style={{ paddingRight: '16px', verticalAlign: 'middle' }}>
                  <Img src={LOGO_URL} alt="ScraAD" style={{ height: '40px', width: 'auto', display: 'block' }} />
                </td>
                <td style={{ paddingLeft: '16px', borderLeft: `1px solid ${brand.border}`, verticalAlign: 'middle' }}>
                  <Img src={MRSOFT_LOGO_URL} alt="MRsoft" style={{ height: '36px', width: 'auto', display: 'block' }} />
                </td>
              </tr>
            </table>
          </Section>
          <Section style={content}>
            <Heading style={title}>{titleText}</Heading>
            {greetingName && (
              <Text style={paragraph}>Hello {greetingName},</Text>
            )}
            {typeof message === 'string' ? (
              <Text style={paragraph}>{message}</Text>
            ) : (
              message
            )}
            {(detailsTitle || detailsBody) && (
              <Section style={detailsBox}>
                {detailsTitle && <Text style={programName}>{detailsTitle}</Text>}
                {detailsBody}
              </Section>
            )}
            {buttonText && actionUrl && (
              <>
                <Section style={buttonWrap}>
                  <Button style={btn} href={actionUrl}>
                    {buttonText}
                  </Button>
                </Section>
                <Text style={fallback}>
                  If the button above doesn't work, copy and paste this link into your browser.
                </Text>
                <Link href={actionUrl} style={linkText}>
                  {actionUrl}
                </Link>
              </>
            )}
            {postButton}
          </Section>
          <Section style={footer}>
            <Text style={footerBrand}>ScraAD</Text>
            <Text style={footerTag}>Scratch to Advance</Text>
            <Text style={footerSub}>Professional Learning Platform</Text>
            <Text style={footerContact}>
              🌐 <Link href="https://scraad.com" style={footerLink}>https://scraad.com</Link>
            </Text>
            <Text style={footerContact}>
              ✉️ <Link href="mailto:support@scraad.com" style={footerLink}>support@scraad.com</Link>
            </Text>
            <Text style={copyright}>
              © {new Date().getFullYear()} ScraAD. All rights reserved.
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const styles = { paragraph, detailsBox, programName, brand }
export { Text, Hr }
