import { createClient } from '@/lib/supabase/client'

export async function uploadVideo(file: File): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `uploads/${fileName}`

  const { error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function uploadImage(file: File): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `uploads/${fileName}`

  const { error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function uploadText(text: string): Promise<string> {
  const supabase = createClient()
  const fileName = `${crypto.randomUUID()}.txt`
  const filePath = `uploads/${fileName}`
  const blob = new Blob([text], { type: 'text/plain' })

  const { error } = await supabase.storage
    .from('videos')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'text/plain',
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath)

  return publicUrl
}
