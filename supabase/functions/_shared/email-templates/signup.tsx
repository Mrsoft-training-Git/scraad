/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, styles, Text } from '../transactional-email-templates/_layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, recipient, confirmationUrl }: SignupEmailProps) => (
  <EmailLayout
    preview={`Confirm your email for ${siteName}`}
    title="Confirm your email"
    message={
      <>
        <Text style={styles.paragraph}>
          Thanks for signing up for <strong>{siteName}</strong>!
        </Text>
        <Text style={styles.paragraph}>
          Please confirm your email address ({recipient}) by clicking the button below.
        </Text>
      </>
    }
    buttonText="Verify Email"
    actionUrl={confirmationUrl}
    postButton={
      <Text style={{ ...styles.paragraph, fontSize: '13px', color: styles.brand.muted, textAlign: 'center' }}>
        If you didn't create an account, you can safely ignore this email.
      </Text>
    }
  />
)

export default SignupEmail
