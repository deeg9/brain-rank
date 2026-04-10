import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { video_url } = body as { video_url?: string }

    if (!video_url) {
      return NextResponse.json({ error: 'video_url is required' }, { status: 400 })
    }

    if (!video_url.startsWith('http://') && !video_url.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 })
    }

    // Check server configuration
    const apiKey = process.env.RUNPOD_API_KEY
    const endpointId = process.env.RUNPOD_ENDPOINT_ID
    if (!apiKey || !endpointId) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Insert job into Supabase
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        video_url,
        status: 'pending' as const,
        runpod_id: null,
        results: null,
        error_message: null,
      })
      .select()
      .single()

    if (insertError || !job) {
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    // Call RunPod /run endpoint
    let runpodResponse: { id: string; status: string }
    try {
      const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: { video_url } }),
      })

      if (!res.ok) {
        // RunPod call failed -- mark job as failed
        await supabase
          .from('jobs')
          .update({ status: 'failed', error_message: 'Failed to start inference' })
          .eq('id', job.id)

        return NextResponse.json({ error: 'Failed to trigger inference' }, { status: 502 })
      }

      runpodResponse = await res.json()
    } catch {
      // Network error calling RunPod
      await supabase
        .from('jobs')
        .update({ status: 'failed', error_message: 'Failed to start inference' })
        .eq('id', job.id)

      return NextResponse.json({ error: 'Failed to trigger inference' }, { status: 502 })
    }

    // Update job with RunPod ID and processing status
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({ runpod_id: runpodResponse.id, status: 'processing' as const })
      .eq('id', job.id)
      .select()
      .single()

    if (updateError || !updatedJob) {
      // Job was created and RunPod was triggered, but update failed
      // Return the job with what we know
      return NextResponse.json(
        { ...job, runpod_id: runpodResponse.id, status: 'processing' },
        { status: 201 }
      )
    }

    return NextResponse.json(updatedJob, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
