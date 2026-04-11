import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { JobStatusResponse, JobStage } from '@/lib/jobs'

function mapToStage(dbStatus: string, runpodStatus: string | null): JobStage {
  if (dbStatus === 'completed') return 'complete'
  if (dbStatus === 'failed') return 'failed'
  // If RunPod says IN_PROGRESS, it's actively processing on GPU
  if (runpodStatus === 'IN_PROGRESS') return 'processing'
  // Otherwise it's queued (pending, IN_QUEUE, or no RunPod status yet)
  return 'queued'
}

function extractFilename(videoUrl: string): string {
  try {
    const url = new URL(videoUrl)
    const segments = url.pathname.split('/')
    return segments[segments.length - 1] || 'video.mp4'
  } catch {
    return 'video.mp4'
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.user_id !== user.id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // If already terminal, return immediately
    if (job.status === 'completed' || job.status === 'failed') {
      const stage = mapToStage(job.status, null)
      const response: JobStatusResponse = {
        id: job.id,
        status: job.status,
        stage,
        error_message: job.error_message,
        video_filename: extractFilename(job.video_url),
      }
      return NextResponse.json(response)
    }

    // Poll RunPod for real status
    let runpodStatus: string | null = null
    if (job.runpod_id) {
      const apiKey = process.env.RUNPOD_API_KEY
      const endpointId = process.env.RUNPOD_ENDPOINT_ID

      if (apiKey && endpointId) {
        try {
          const res = await fetch(
            `https://api.runpod.ai/v2/${endpointId}/status/${job.runpod_id}`,
            { headers: { 'Authorization': `Bearer ${apiKey}` } }
          )

          if (res.ok) {
            const runpodData = await res.json()
            runpodStatus = runpodData.status

            if (runpodData.status === 'COMPLETED' && runpodData.output) {
              await supabase
                .from('jobs')
                .update({ status: 'completed', results: runpodData.output })
                .eq('id', id)

              const response: JobStatusResponse = {
                id: job.id,
                status: 'completed',
                stage: 'complete',
                error_message: null,
                video_filename: extractFilename(job.video_url),
              }
              return NextResponse.json(response)
            } else if (
              runpodData.status === 'FAILED' ||
              runpodData.status === 'CANCELLED' ||
              runpodData.status === 'TIMED_OUT'
            ) {
              const errorMsg = runpodData.error || 'Inference failed'
              await supabase
                .from('jobs')
                .update({ status: 'failed', error_message: errorMsg })
                .eq('id', id)

              const response: JobStatusResponse = {
                id: job.id,
                status: 'failed',
                stage: 'failed',
                error_message: errorMsg,
                video_filename: extractFilename(job.video_url),
              }
              return NextResponse.json(response)
            }
            // IN_QUEUE or IN_PROGRESS — fall through
          }
        } catch {
          // RunPod unreachable — return current status
        }
      }
    }

    const stage = mapToStage(job.status, runpodStatus)
    const response: JobStatusResponse = {
      id: job.id,
      status: job.status,
      stage,
      error_message: job.error_message,
      video_filename: extractFilename(job.video_url),
    }
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
