import type { ComponentType } from 'npm:react@18.3.1'

import { template as welcome } from './welcome.tsx'
import { template as enrollmentConfirmation } from './enrollment-confirmation.tsx'
import { template as paymentReceipt } from './payment-receipt.tsx'
import { template as learningUpdate } from './learning-update.tsx'
import { template as deadlineReminder } from './deadline-reminder.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: Record<string, any>) => string)
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'enrollment-confirmation': enrollmentConfirmation,
  'payment-receipt': paymentReceipt,
  'learning-update': learningUpdate,
  'deadline-reminder': deadlineReminder,
}
