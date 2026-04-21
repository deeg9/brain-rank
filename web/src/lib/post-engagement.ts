// Self-reported real-world engagement attached to an analysis job.
// Users tell us where they posted their content and how it performed — we
// store a point-in-time snapshot they can refresh. No external API calls;
// everything here is client-side shaping + validation.

export type PostedPlatform = 'youtube' | 'tiktok' | 'instagram' | 'other'

export interface PostEngagement {
  postedUrl: string | null
  postedPlatform: PostedPlatform | null
  postedAt: string | null // ISO YYYY-MM-DD
  viewsCount: number | null
  likesCount: number | null
  commentsCount: number | null
  sharesCount: number | null
  bookmarksCount: number | null
  engagementCapturedAt: string | null // ISO timestamp
}

export interface PostEngagementInput {
  postedUrl?: string | null
  postedAt?: string | null
  viewsCount?: number | null
  likesCount?: number | null
  commentsCount?: number | null
  sharesCount?: number | null
  bookmarksCount?: number | null
}

const PLATFORM_HOSTS: Record<PostedPlatform, RegExp[]> = {
  youtube: [/(^|\.)youtube\.com$/i, /(^|\.)youtu\.be$/i],
  tiktok: [/(^|\.)tiktok\.com$/i],
  instagram: [/(^|\.)instagram\.com$/i],
  other: [],
}

export function detectPlatform(url: string | null | undefined): PostedPlatform | null {
  if (!url) return null
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return null
  }
  for (const platform of ['youtube', 'tiktok', 'instagram'] as const) {
    if (PLATFORM_HOSTS[platform].some((re) => re.test(host))) return platform
  }
  return 'other'
}

export function platformLabel(p: PostedPlatform): string {
  switch (p) {
    case 'youtube':
      return 'YouTube'
    case 'tiktok':
      return 'TikTok'
    case 'instagram':
      return 'Instagram'
    case 'other':
      return 'Link'
  }
}

// Material-symbols icon names used for the small platform chip.
export function platformIcon(p: PostedPlatform): string {
  switch (p) {
    case 'youtube':
      return 'smart_display'
    case 'tiktok':
      return 'music_note'
    case 'instagram':
      return 'photo_camera'
    case 'other':
      return 'link'
  }
}

// Shares are shown for every platform. Even YouTube's creator analytics
// surfaces a share count, so we let users report it regardless of platform.
export function platformShowsShares(_p: PostedPlatform): boolean {
  return true
}

// Instagram labels the play count as "plays"; the others use "views".
export function viewsLabel(p: PostedPlatform | null): string {
  return p === 'instagram' ? 'Plays' : 'Views'
}

const MAX_COUNT = 100_000_000_000
const MIN_POSTED_AT = new Date('2010-01-01').getTime()

export type ValidationResult =
  | { ok: true; value: PostEngagement }
  | { ok: false; reason: string }

// Normalizes + validates raw form input. Empty URL collapses the entire
// payload to null — safe to always call even when the user hasn't toggled
// the optional section on.
export function validatePostEngagement(input: PostEngagementInput): ValidationResult {
  const rawUrl = (input.postedUrl ?? '').trim()

  if (!rawUrl) {
    return {
      ok: true,
      value: {
        postedUrl: null,
        postedPlatform: null,
        postedAt: null,
        viewsCount: null,
        likesCount: null,
        commentsCount: null,
        sharesCount: null,
        bookmarksCount: null,
        engagementCapturedAt: null,
      },
    }
  }

  // Users often type "youtube.com/..." without a protocol — normalize to https://.
  const trimmedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`

  let parsed: URL
  try {
    parsed = new URL(trimmedUrl)
  } catch {
    return { ok: false, reason: "That link doesn't look valid." }
  }
  if (!parsed.hostname.includes('.')) {
    return { ok: false, reason: "That link doesn't look valid." }
  }

  const platform = detectPlatform(parsed.toString()) ?? 'other'

  const postedAt = (input.postedAt ?? '').trim()
  if (!postedAt) {
    return { ok: false, reason: 'Please add the date the content was posted.' }
  }
  const postedDate = new Date(postedAt)
  if (Number.isNaN(postedDate.getTime())) {
    return { ok: false, reason: 'Posted date is not a valid date.' }
  }
  if (postedDate.getTime() > Date.now()) {
    return { ok: false, reason: "Posted date can't be in the future." }
  }
  if (postedDate.getTime() < MIN_POSTED_AT) {
    return { ok: false, reason: 'Posted date looks too far in the past.' }
  }

  const counts: Array<[keyof PostEngagementInput, string]> = [
    ['viewsCount', 'Views'],
    ['likesCount', 'Likes'],
    ['commentsCount', 'Comments'],
    ['sharesCount', 'Shares'],
    ['bookmarksCount', 'Bookmarks'],
  ]

  const out: Record<string, number | null> = {}
  for (const [key, label] of counts) {
    const raw = input[key]
    if (raw === undefined || raw === null || (typeof raw === 'string' && raw === '')) {
      out[key] = null
      continue
    }
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, reason: `${label} must be a non-negative number.` }
    }
    if (!Number.isInteger(n)) {
      return { ok: false, reason: `${label} must be a whole number.` }
    }
    if (n > MAX_COUNT) {
      return { ok: false, reason: `${label} looks too large — double-check the number.` }
    }
    out[key] = n
  }

  return {
    ok: true,
    value: {
      postedUrl: trimmedUrl,
      postedPlatform: platform,
      postedAt,
      viewsCount: out.viewsCount,
      likesCount: out.likesCount,
      commentsCount: out.commentsCount,
      sharesCount: out.sharesCount,
      bookmarksCount: out.bookmarksCount,
      engagementCapturedAt: new Date().toISOString(),
    },
  }
}

// Compact display formatter: 1.2K / 3.4M / 1.1B.
export function formatCount(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n < 1_000) return n.toLocaleString()
  if (n < 1_000_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0).replace(/\.0$/, '')}M`
  return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
}
