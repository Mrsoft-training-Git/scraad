/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, styles, Text } from '../transactional-email-templates/_layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, confirmationUrl }: InviteEmailProps) => (
  <EmailLayout
    preview={`You've been invited to join ${siteName}`}
    title="You've been invited"
    message={`You've been invited to join ${siteName}. Click the button below to accept the invitation and create your account.`}
    buttonText="Accept Invitation"
    actionUrl={confirmationUrl}
    postButton={
      <Text style={{ ...styles.paragraph, fontSize: '13px', color: styles.brand.muted, textAlign: 'center' }}>
        If you weren't expecting this invitation, you can safely ignore this email.
      </Text>
    }
  />
)

export default InviteEmail
