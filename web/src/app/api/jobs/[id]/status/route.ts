import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type JobStatusResponse, type JobStage, extractFilename } from '@/lib/jobs'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { AnalysisCompleteEmail } from '@/lib/emails/analysis-complete'
import { AnalysisFailedEmail } from '@/lib/emails/analysis-failed'

function mapToStage(dbStatus: string, runpodStatus: string | null): JobStage {
  if (dbStatus === 'completed') return 'complete'
  if (dbStatus === 'failed') return 'failed'
  // If RunPod says IN_PROGRESS, it's actively processing on GPU
  if (runpodStatus === 'IN_PROGRESS') return 'processing'
  // Otherwise it's queued (pending, IN_QUEUE, or no RunPod status yet)
  return 'queued'
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

    // If already terminal, send email if needed and return
    if (job.status === 'completed' || job.status === 'failed') {
      if (!job.email_sent && user.email) {
        // Atomic claim: only send if we win the race against the webhook
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
                to: user.email,
                subject: 'Your BRAIN | RANK analysis is ready',
                react: AnalysisCompleteEmail({
                  videoFilename: extractFilename(job.video_url),
                  resultsUrl: `${baseUrl}/results/${id}`,
                }),
              })
            } else {
              await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: "Your BRAIN | RANK analysis couldn't be completed",
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

              // Send completion email (atomic guard against webhook race)
              if (!job.email_sent && user.email) {
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
                    await resend.emails.send({
                      from: FROM_EMAIL,
                      to: user.email,
                      subject: 'Your BRAIN | RANK analysis is ready',
                      react: AnalysisCompleteEmail({
                        videoFilename: extractFilename(job.video_url),
                        resultsUrl: `${baseUrl}/results/${id}`,
                      }),
                    })
                  } catch (e) {
                    console.error('Failed to send email:', e)
                  }
                }
              }

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

              // Send failure email (atomic guard against webhook race)
              if (!job.email_sent && user.email) {
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
                    await resend.emails.send({
                      from: FROM_EMAIL,
                      to: user.email,
                      subject: 'Your BRAIN | RANK analysis couldn\'t be completed',
                      react: AnalysisFailedEmail({
                        videoFilename: extractFilename(job.video_url),
                        uploadUrl: `${baseUrl}/upload`,
                        errorMessage: errorMsg,
                      }),
                    })
                  } catch (e) {
                    console.error('Failed to send email:', e)
                  }
                }
              }

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

    // For app-level queued jobs (waiting behind this user's other in-flight jobs),
    // compute position + rough ETA so the UI can show something honest.
    if (job.status === 'queued') {
      const { count: aheadOfThis } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'queued')
        .lt('created_at', job.created_at)

      const position = (aheadOfThis ?? 0) + 1
      response.queue_position = position
      // Rough estimate: ~45s per slot ahead (30s warm inference + slack).
      response.eta_seconds = position * 45
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
