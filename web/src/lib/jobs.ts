import type { JobStatus } from '@/lib/database.types'

export interface JobStatusResponse {
  id: string
  status: JobStatus
  stage: JobStage
  progress: number
  error_message: string | null
  video_filename: string
}

export type JobStage = 'uploading' | 'analyzing_audio' | 'encoding_video' | 'predicting' | 'complete' | 'failed'

export const STAGES: { key: JobStage; label: string; icon: string }[] = [
  { key: 'uploading', label: 'Uploading', icon: 'cloud_upload' },
  { key: 'analyzing_audio', label: 'Analyzing Audio', icon: 'graphic_eq' },
  { key: 'encoding_video', label: 'Encoding Video', icon: 'movie' },
  { key: 'predicting', label: 'Predicting Brain Activation', icon: 'neurology' },
]

export function getStageProgress(stage: JobStage): number {
  switch (stage) {
    case 'uploading': return 15
    case 'analyzing_audio': return 40
    case 'encoding_video': return 68
    case 'predicting': return 90
    case 'complete': return 100
    case 'failed': return 0
    default: return 0
  }
}

export function getStageIndex(stage: JobStage): number {
  const idx = STAGES.findIndex(s => s.key === stage)
  return idx === -1 ? STAGES.length : idx
}

export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`/api/jobs/${jobId}/status`)
  if (!res.ok) {
    throw new Error(`Failed to fetch job status: ${res.status}`)
  }
  return res.json()
}

export async function retryJob(jobId: string): Promise<void> {
  const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`Failed to retry job: ${res.status}`)
  }
}
