export const BATCH_LIMITS = {
  FREE_MAX_FILES: 1,
  PAID_MAX_FILES: 20,
  VIDEO_MAX_SECONDS: 120,
  VIDEO_MAX_BYTES: 200 * 1024 * 1024,
  IMAGE_MAX_BYTES: 10 * 1024 * 1024,
  TEXT_MAX_CHARS: 10_000,
} as const

export type ValidationResult = { ok: true } | { ok: false; reason: string }

/**
 * Read a video file's duration in the browser.
 * Returns null if the browser can't determine duration.
 */
export function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(video.duration) ? video.duration : null)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
  })
}

export async function validateVideoFile(file: File): Promise<ValidationResult> {
  if (file.size > BATCH_LIMITS.VIDEO_MAX_BYTES) {
    return {
      ok: false,
      reason: `File is ${(file.size / 1024 / 1024).toFixed(0)} MB — max ${BATCH_LIMITS.VIDEO_MAX_BYTES / 1024 / 1024} MB.`,
    }
  }
  const duration = await getVideoDuration(file)
  if (duration != null && duration > BATCH_LIMITS.VIDEO_MAX_SECONDS) {
    return {
      ok: false,
      reason: `Video is ${Math.round(duration)}s — max ${BATCH_LIMITS.VIDEO_MAX_SECONDS}s supported.`,
    }
  }
  return { ok: true }
}

export function validateImageFile(file: File): ValidationResult {
  if (file.size > BATCH_LIMITS.IMAGE_MAX_BYTES) {
    return {
      ok: false,
      reason: `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — max ${BATCH_LIMITS.IMAGE_MAX_BYTES / 1024 / 1024} MB.`,
    }
  }
  return { ok: true }
}

export function validateTextContent(text: string): ValidationResult {
  if (text.length > BATCH_LIMITS.TEXT_MAX_CHARS) {
    return {
      ok: false,
      reason: `Text is ${text.length.toLocaleString()} chars — max ${BATCH_LIMITS.TEXT_MAX_CHARS.toLocaleString()}.`,
    }
  }
  return { ok: true }
}

export function maxFilesForTier(isCreator: boolean): number {
  return isCreator ? BATCH_LIMITS.PAID_MAX_FILES : BATCH_LIMITS.FREE_MAX_FILES
}
