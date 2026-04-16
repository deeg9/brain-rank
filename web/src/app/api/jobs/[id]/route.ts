import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { extractFilename } from '@/lib/jobs'
import { AnalysisCompleteEmail } from '@/lib/emails/analysis-complete'
import { AnalysisFailedEmail } from '@/lib/emails/analysis-failed'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : null
    const isPublic = typeof body.is_public === 'boolean' ? body.is_public : undefined
    const category = typeof body.category === 'string' ? body.category : undefined

    const updateFields: { title?: string; is_public?: boolean; category?: string } = {}
    if (title !== null) updateFields.title = title
    if (isPublic !== undefined) updateFields.is_public = isPublic
    if (category !== undefined) updateFields.category = category

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: job, error: updateError } = await supabase
      .from('jobs')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch job first (before auth check) to support public access
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Public jobs: return data without auth (no RunPod polling for public viewers)
    if (job.is_public === true) {
      // Check if the requester is the owner (for RunPod polling)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && job.user_id === user.id) {
        // Owner viewing their own public job -- fall through to RunPod polling below
      } else {
        // Non-owner or unauthenticated -- return as-is without internal infra details
        return NextResponse.json(job)
      }
    } else {
      // Private job: require auth + ownership
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      // Verify ownership -- return 404 to avoid leaking job existence
      if (job.user_id !== user.id) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
    }

    // If job is in a terminal state, send email if needed and return
    if (job.status === 'completed' || job.status === 'failed') {
      if (!job.email_sent) {
        const { data: { user: owner } } = await supabase.auth.getUser()
        if (owner?.email) {
          const { data: claimed } = await supabase
            .from('jobs')
            .update({ email_sent: true })
            .eq('id', id)
            .eq('email_sent', false)
            .select('id')
            .single()

          if (claimed) {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trybrainrank.com'
            try {
              if (job.status === 'completed') {
                await resend.emails.send({
                  from: FROM_EMAIL,
                  to: owner.email,
                  subject: 'Your BrainRank analysis is ready',
                  react: AnalysisCompleteEmail({
                    videoFilename: extractFilename(job.video_url),
                    resultsUrl: `${baseUrl}/results/${id}`,
                  }),
                })
              } else {
                await resend.emails.send({
                  from: FROM_EMAIL,
                  to: owner.email,
                  subject: "Your BrainRank analysis couldn't be completed",
                  react: AnalysisFailedEmail({
                    videoFilename: extractFilename(job.video_url),
                    uploadUrl: `${baseUrl}/upload`,
                    errorMessage: job.error_message ?? undefined,
                  }),
                })
              }
            } catch (e) {
              console.error('Failed to send email:', e)
            }
          }
        }
      }
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

export async function DELETE(
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

    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
