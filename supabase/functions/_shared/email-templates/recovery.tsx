/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, styles, Text } from '../transactional-email-templates/_layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <EmailLayout
    preview={`Reset your password for ${siteName}`}
    title="Reset your password"
    message={`We received a request to reset your password for ${siteName}. Click the button below to choose a new password.`}
    buttonText="Reset Password"
    actionUrl={confirmationUrl}
    postButton={
      <Text style={{ ...styles.paragraph, fontSize: '13px', color: styles.brand.muted, textAlign: 'center' }}>
        If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
      </Text>
    }
  />
)

export default RecoveryEmail
