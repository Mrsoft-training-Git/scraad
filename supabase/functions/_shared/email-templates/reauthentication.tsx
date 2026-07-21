/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, styles, Text } from '../transactional-email-templates/_layout.tsx'

interface ReauthenticationEmailProps {
  token: string
}

const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 700 as const,
  color: styles.brand.navy,
  letterSpacing: '6px',
  textAlign: 'center' as const,
  backgroundColor: '#f6f8fb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailLayout
    preview="Your verification code"
    title="Confirm reauthentication"
    message="Use the code below to confirm your identity:"
    postButton={
      <>
        <Text style={codeStyle}>{token}</Text>
        <Text style={{ ...styles.paragraph, fontSize: '13px', color: styles.brand.muted, textAlign: 'center' }}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
      </>
    }
  />
)

export default ReauthenticationEmail
