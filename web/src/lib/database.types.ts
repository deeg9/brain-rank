export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Job {
  id: string
  user_id: string
  video_url: string
  title: string | null
  is_public: boolean
  view_count: number
  status: JobStatus
  runpod_id: string | null
  results: Record<string, unknown> | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Bookmark {
  user_id: string
  job_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'is_public' | 'view_count' | 'created_at' | 'updated_at'> & {
          id?: string
          is_public?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Job, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Pick<Profile, 'id'> & Partial<Omit<Profile, 'id'>>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      bookmarks: {
        Row: Bookmark
        Insert: Omit<Bookmark, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Bookmark, 'user_id' | 'job_id'>>
      }
    }
  }
}
