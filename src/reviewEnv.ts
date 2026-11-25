import { createContext } from 'react'
import type { AzureConfig } from './azureClient.ts'
import type { AuditEvent, AzureWorkItem } from './domain'

// PIR-13, PIR-17, PIR-18: what posting a PI review needs, wherever the form is (PI Review, My PI Review, the Close
// pop-up): the viewer's work email and View as, the Time Writing connection and its PAT, the fetched items (for the PI
// list) and the audit. Provided by the app; without a provider nothing can be posted.
export interface ReviewEnv {
  email: string; viewingAs: string; isSample: boolean; config: AzureConfig | null; pat: string; items: AzureWorkItem[]
  addAudit: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void
}
export const ReviewEnvContext = createContext<ReviewEnv | null>(null)
