/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Row, Column, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { main, container, header, brandName, h1, text, muted, card, footer, brand } from './_brand.ts'

interface Props {
  name?: string
  itemTitle?: string
  amount?: string
  currency?: string
  reference?: string
  paymentType?: string
  paidAt?: string
}

const row = { padding: '6px 0' }
const label = { ...muted, margin: 0, fontSize: '13px' }
const value = { ...text, margin: 0, fontSize: '14px', fontWeight: 600 as const, textAlign: 'right' as const, color: brand.ink }

const Email = ({
  name = 'there',
  itemTitle = 'your enrollment',
  amount = '0.00',
  currency = 'NGN',
  reference = '—',
  paymentType,
  paidAt,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment received — {currency} {amount}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brandName}>ScraAD</Heading>
        </Section>
        <Heading style={h1}>Payment received</Heading>
        <Text style={text}>
          Hi {name}, thanks for your payment. Here's your receipt for your records.
        </Text>

        <Section style={card}>
          <Row style={row}>
            <Column><Text style={label}>Item</Text></Column>
            <Column><Text style={value}>{itemTitle}</Text></Column>
          </Row>
          <Hr style={{ borderColor: brand.border, margin: '8px 0' }} />
          <Row style={row}>
            <Column><Text style={label}>Amount</Text></Column>
            <Column><Text style={{ ...value, color: brand.navy, fontSize: '16px' }}>{currency} {amount}</Text></Column>
          </Row>
          {paymentType && (
            <>
              <Hr style={{ borderColor: brand.border, margin: '8px 0' }} />
              <Row style={row}>
                <Column><Text style={label}>Payment type</Text></Column>
                <Column><Text style={value}>{paymentType}</Text></Column>
              </Row>
            </>
          )}
          <Hr style={{ borderColor: brand.border, margin: '8px 0' }} />
          <Row style={row}>
            <Column><Text style={label}>Reference</Text></Column>
            <Column><Text style={{ ...value, fontFamily: 'monospace', fontSize: '12px' }}>{reference}</Text></Column>
          </Row>
          {paidAt && (
            <>
              <Hr style={{ borderColor: brand.border, margin: '8px 0' }} />
              <Row style={row}>
                <Column><Text style={label}>Date</Text></Column>
                <Column><Text style={value}>{paidAt}</Text></Column>
              </Row>
            </>
          )}
        </Section>

        <Text style={muted}>
          You can review all your transactions from the Billing section of your dashboard.
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
  subject: (d) => `Receipt for ${d.itemTitle ?? 'your payment'}`,
  displayName: 'Payment Receipt',
  previewData: {
    name: 'Jane',
    itemTitle: 'PGD in Cybersecurity',
    amount: '250,000.00',
    currency: 'NGN',
    reference: 'PSK_ABC123XYZ',
    paymentType: 'First installment',
    paidAt: 'Aug 3, 2026',
  },
} satisfies TemplateEntry
