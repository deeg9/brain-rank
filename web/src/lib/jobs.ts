import type { JobStatus } from '@/lib/database.types'

export interface JobStatusResponse {
  id: string
  status: JobStatus
  stage: JobStage
  error_message: string | null
  video_filename: string
}

export type JobStage = 'queued' | 'processing' | 'complete' | 'failed'

export const STAGES: { key: JobStage; label: string; icon: string }[] = [
  { key: 'queued', label: 'In Queue', icon: 'hourglass_top' },
  { key: 'processing', label: 'Processing', icon: 'neurology' },
]

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

export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`/api/jobs/${jobId}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel' }),
  })
  if (!res.ok) {
    throw new Error(`Failed to cancel job: ${res.status}`)
  }
}

export async function retryJob(jobId: string): Promise<void> {
  const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`Failed to retry job: ${res.status}`)
  }
}
