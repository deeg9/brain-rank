export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Job {
  id: string
  user_id: string
  video_url: string
  status: JobStatus
  runpod_id: string | null
  results: Record<string, unknown> | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Job, 'id' | 'created_at'>>
      }
    }
  }
}
