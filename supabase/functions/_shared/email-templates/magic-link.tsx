/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, styles, Text } from '../transactional-email-templates/_layout.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <EmailLayout
    preview={`Your login link for ${siteName}`}
    title="Your login link"
    message={`Click the button below to log in to ${siteName}. This link will expire shortly.`}
    buttonText="Log In"
    actionUrl={confirmationUrl}
    postButton={
      <Text style={{ ...styles.paragraph, fontSize: '13px', color: styles.brand.muted, textAlign: 'center' }}>
        If you didn't request this link, you can safely ignore this email.
      </Text>
    }
  />
)

export default MagicLinkEmail
