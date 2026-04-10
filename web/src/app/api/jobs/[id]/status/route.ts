import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { JobStatusResponse, JobStage } from '@/lib/jobs'
import { getStageProgress } from '@/lib/jobs'

function mapStatusToStage(status: string, runpodId: string | null): JobStage {
  switch (status) {
    case 'pending':
      return runpodId ? 'uploading' : 'uploading'
    case 'processing':
      return 'encoding_video'
    case 'completed':
      return 'complete'
    case 'failed':
      return 'failed'
    default:
      return 'uploading'
  }
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

    const stage = mapStatusToStage(job.status, job.runpod_id)

    const response: JobStatusResponse = {
      id: job.id,
      status: job.status,
      stage,
      progress: getStageProgress(stage),
      error_message: job.error_message,
      video_filename: extractFilename(job.video_url),
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
