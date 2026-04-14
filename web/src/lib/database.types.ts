export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type InputType = 'video' | 'image' | 'text' | 'text_spoken' | 'text_visual'

export interface Job {
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

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'unpaid'
  | 'paused'

export interface Customer {
  id: string
  stripe_customer_id: string
  created_at: string
}

export interface Subscription {
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

export interface CreditUsage {
  id: string
  user_id: string
  job_id: string | null
  created_at: string
}

export interface StripeEvent {
  id: string
  stripe_event_id: string
  event_type: string
  processed_at: string
  error: string | null
}

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'is_public' | 'view_count' | 'input_type' | 'text_content' | 'text_style' | 'created_at' | 'updated_at'> & {
          id?: string
          is_public?: boolean
          view_count?: number
          input_type?: InputType
          text_content?: string | null
          text_style?: string | null
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
      customers: {
        Row: Customer
        Insert: Pick<Customer, 'id' | 'stripe_customer_id'> & { created_at?: string }
        Update: Partial<Pick<Customer, 'stripe_customer_id'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Pick<Subscription, 'id' | 'user_id' | 'status'> & Partial<Omit<Subscription, 'id' | 'user_id' | 'status'>>
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>
      }
      credit_usage: {
        Row: CreditUsage
        Insert: Pick<CreditUsage, 'user_id'> & Partial<Omit<CreditUsage, 'user_id'>>
        Update: Partial<Omit<CreditUsage, 'id' | 'created_at'>>
      }
      stripe_events: {
        Row: StripeEvent
        Insert: Pick<StripeEvent, 'stripe_event_id' | 'event_type'> & Partial<Omit<StripeEvent, 'stripe_event_id' | 'event_type'>>
        Update: Partial<Pick<StripeEvent, 'error'>>
      }
    }
  }
}
