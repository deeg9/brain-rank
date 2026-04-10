import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch job
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify ownership -- return 404 to avoid leaking job existence
    if (job.user_id !== user.id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // If job is in a terminal state, return as-is
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json(job)
    }

    // If RunPod was never triggered, return as-is
    if (!job.runpod_id) {
      return NextResponse.json(job)
    }

    // Check server configuration
    const apiKey = process.env.RUNPOD_API_KEY
    const endpointId = process.env.RUNPOD_ENDPOINT_ID
    if (!apiKey || !endpointId) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Poll RunPod for status
    let runpodData: {
      id: string
      status: string
      output?: Record<string, unknown>
      error?: string
    }

    try {
      const res = await fetch(
        `https://api.runpod.ai/v2/${endpointId}/status/${job.runpod_id}`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
      )

      if (!res.ok) {
        // RunPod API error -- return current job without updating
        return NextResponse.json({ ...job, _polling_error: 'Could not reach RunPod' })
      }

      runpodData = await res.json()
    } catch {
      // Network error -- return current job without updating
      return NextResponse.json({ ...job, _polling_error: 'Could not reach RunPod' })
    }

    // Map RunPod status to job status
    type JobStatusType = 'pending' | 'processing' | 'completed' | 'failed'
    const updateData: {
      status: JobStatusType
      results?: Record<string, unknown>
      error_message?: string
    } = { status: 'processing' }

    switch (runpodData.status) {
      case 'IN_QUEUE':
      case 'IN_PROGRESS':
        updateData.status = 'processing'
        break
      case 'COMPLETED':
        updateData.status = 'completed'
        if (runpodData.output) {
          updateData.results = runpodData.output
        }
        break
      case 'FAILED':
      case 'CANCELLED':
      case 'TIMED_OUT':
        updateData.status = 'failed'
        updateData.error_message = runpodData.error || 'Inference failed'
        break
      default:
        // Unknown status -- keep as processing
        updateData.status = 'processing'
    }

    // Update job in Supabase
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedJob) {
      // Update failed -- return current job with mapped status
      return NextResponse.json({ ...job, status: updateData.status })
    }

    return NextResponse.json(updatedJob)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
