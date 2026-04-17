export type JobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed'

export type InputType = 'video' | 'image' | 'text' | 'text_spoken' | 'text_visual'

export type Job = {
  id: string
  user_id: string
  video_url: string
  title: string | null
  is_public: boolean
  view_count: number
  status: JobStatus
  input_type: InputType
  text_content: string | null
  text_style: string | null
  category: string | null
  runpod_id: string | null
  results: Record<string, unknown> | null
  error_message: string | null
  email_sent: boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type Bookmark = {
  user_id: string
  job_id: string
  created_at: string
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'unpaid'
  | 'paused'

export type Customer = {
  id: string
  stripe_customer_id: string
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  status: SubscriptionStatus
  price_id: string | null
  quantity: number
  cancel_at_period_end: boolean
  cancel_at: string | null
  canceled_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_start: string | null
  trial_end: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type CreditUsage = {
  id: string
  user_id: string
  job_id: string | null
  created_at: string
}

export type StripeEvent = {
  id: string
  stripe_event_id: string
  event_type: string
  processed_at: string
  error: string | null
}

export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'title' | 'is_public' | 'view_count' | 'input_type' | 'text_content' | 'text_style' | 'category' | 'runpod_id' | 'results' | 'error_message' | 'email_sent' | 'created_at' | 'updated_at'> & {
          id?: string
          title?: string | null
          is_public?: boolean
          view_count?: number
          input_type?: InputType
          text_content?: string | null
          text_style?: string | null
          category?: string | null
          runpod_id?: string | null
          results?: Record<string, unknown> | null
          error_message?: string | null
          email_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Job, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'jobs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: Profile
        Insert: Pick<Profile, 'id'> & Partial<Omit<Profile, 'id'>>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      bookmarks: {
        Row: Bookmark
        Insert: Omit<Bookmark, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Bookmark, 'user_id' | 'job_id'>>
        Relationships: [
          {
            foreignKeyName: 'bookmarks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookmarks_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          }
        ]
      }
      customers: {
        Row: Customer
        Insert: Pick<Customer, 'id' | 'stripe_customer_id'> & { created_at?: string }
        Update: Partial<Pick<Customer, 'stripe_customer_id'>>
        Relationships: []
      }
      subscriptions: {
        Row: Subscription
        Insert: Pick<Subscription, 'id' | 'user_id' | 'status'> & Partial<Omit<Subscription, 'id' | 'user_id' | 'status'>>
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      credit_usage: {
        Row: CreditUsage
        Insert: Pick<CreditUsage, 'user_id'> & Partial<Omit<CreditUsage, 'user_id'>>
        Update: Partial<Omit<CreditUsage, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'credit_usage_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      stripe_events: {
        Row: StripeEvent
        Insert: Pick<StripeEvent, 'stripe_event_id' | 'event_type'> & Partial<Omit<StripeEvent, 'stripe_event_id' | 'event_type'>>
        Update: Partial<Pick<StripeEvent, 'error'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: {
        Args: { p_job_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
