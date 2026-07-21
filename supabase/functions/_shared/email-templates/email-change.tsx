/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, styles, Text } from '../transactional-email-templates/_layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailLayout
    preview={`Confirm your email change for ${siteName}`}
    title="Confirm your email change"
    message={
      <>
        <Text style={styles.paragraph}>
          You requested to change your email address for {siteName} from{' '}
          <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
        </Text>
        <Text style={styles.paragraph}>Click the button below to confirm this change.</Text>
      </>
    }
    buttonText="Confirm Email Change"
    actionUrl={confirmationUrl}
    postButton={
      <Text style={{ ...styles.paragraph, fontSize: '13px', color: styles.brand.muted, textAlign: 'center' }}>
        If you didn't request this change, please secure your account immediately.
      </Text>
    }
  />
)

export default EmailChangeEmail
