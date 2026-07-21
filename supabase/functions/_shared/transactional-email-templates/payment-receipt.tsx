/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, styles, Text } from './_layout.tsx'

interface Props {
  name?: string
  itemTitle?: string
  amount?: string
  currency?: string
  reference?: string
  paymentType?: string
  paidAt?: string
  dashboardUrl?: string
}

const row = { ...styles.paragraph, margin: '6px 0', fontSize: '14px' }
const amountRow = {
  ...styles.paragraph,
  margin: '10px 0',
  fontSize: '18px',
  fontWeight: 700 as const,
  color: styles.brand.navy,
}

const Email = ({
  name = 'there',
  itemTitle = 'your enrollment',
  amount = '0.00',
  currency = 'NGN',
  reference = '—',
  paymentType,
  paidAt,
  dashboardUrl = 'https://scraad011.lovable.app/dashboard/bills',
}: Props) => (
  <EmailLayout
    preview={`Payment received — ${currency} ${amount}`}
    title="Payment received ✅"
    greetingName={name}
    message="Thank you for your payment. Here's your official receipt for your records."
    detailsTitle={itemTitle}
    detailsBody={
      <>
        <Text style={amountRow}>{currency} {amount}</Text>
        {paymentType && <Text style={row}>💳 Payment type: {paymentType}</Text>}
        <Text style={{ ...row, fontFamily: 'monospace', fontSize: '12px' }}>
          🔖 Reference: {reference}
        </Text>
        {paidAt && <Text style={row}>📅 Date: {paidAt}</Text>}
      </>
    }
    buttonText="View my billing"
    actionUrl={dashboardUrl}
  />
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
