import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractScoreInfo } from '@/lib/results'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all bookmarks for the current user
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('job_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (bookmarksError || !bookmarks) {
      console.error('Failed to fetch bookmarks:', bookmarksError)
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
    }

    if (bookmarks.length === 0) {
      return NextResponse.json([])
    }

    // Fetch jobs for the bookmarked IDs
    const jobIds = bookmarks.map((b) => b.job_id)

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, video_url, results, created_at, user_id, view_count, input_type, text_content')
      .in('id', jobIds)
      .eq('is_public', true)
      .eq('status', 'completed')

    if (jobsError || !jobs) {
      console.error('Failed to fetch bookmarked jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch bookmarked jobs' }, { status: 500 })
    }

    type JobRow = {
      id: string
      title: string | null
      video_url: string
      results: Record<string, unknown> | null
      created_at: string
      user_id: string
      view_count: number
      input_type: string | null
      text_content: string | null
    }

    const typedJobs = jobs as unknown as JobRow[]

    // Fetch creator profiles
    const uniqueUserIds = [...new Set(typedJobs.map((j) => j.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', uniqueUserIds)

    type ProfileRow = { id: string; username: string | null; avatar_url: string | null }
    const typedProfiles = (profiles || []) as unknown as ProfileRow[]
    const profileMap = new Map(typedProfiles.map((p) => [p.id, p]))

    // Map to DiscoverAnalysis-compatible objects with view_count
    const result = typedJobs.map((job) => {
      const profile = profileMap.get(job.user_id)
      const scoreInfo = extractScoreInfo(job.results as Record<string, unknown> | null)

      return {
        id: job.id,
        title: job.title,
        video_url: job.video_url,
        overall_score: scoreInfo?.score ?? null,
        breakdown: scoreInfo?.breakdown,
        created_at: job.created_at,
        view_count: job.view_count,
        creator_username: profile?.username ?? null,
        creator_avatar_url: profile?.avatar_url ?? null,
        input_type: job.input_type ?? null,
        text_content: job.text_content ?? null,
      }
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
