import { type InputType } from '@/lib/database.types'

export type BatchItem = {
  videoUrl: string
  inputType?: InputType
  textContent?: string | null
  textStyle?: string | null
  category?: string | null
}

export type CreateJobResult = {
  jobId: string
  status: 'processing' | 'queued' | 'failed'
  message?: string
}
