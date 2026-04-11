import { createClient } from '@/lib/supabase/client'

/**
 * Resize an image file to a 256x256 center-cropped webp avatar.
 */
export async function resizeToAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Center-crop (cover fit): use the smaller dimension to determine scale
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2

      ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create avatar blob'))
          }
        },
        'image/webp',
        0.8
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Upload an avatar blob to Supabase Storage and return the public URL.
 */
export async function uploadAvatar(blob: Blob, userId: string): Promise<string> {
  const supabase = createClient()
  const filePath = `${userId}/${userId}.webp`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/webp',
    })

  if (error) throw new Error(`Avatar upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Cache-bust with timestamp
  return `${publicUrl}?t=${Date.now()}`
}

/**
 * Get initials from username or email for default avatar display.
 */
export function getInitials(username: string | null, email: string): string {
  if (username) {
    return username.slice(0, 2).toUpperCase()
  }
  return (email[0] ?? '?').toUpperCase()
}

/**
 * Get a deterministic Tailwind background color class based on username or email.
 */
export function getInitialsColor(username: string | null, email: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
  ]
  const str = username ?? email
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i)
  }
  return colors[hash % colors.length]
}
