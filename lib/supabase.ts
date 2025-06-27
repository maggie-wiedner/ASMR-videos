import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Database = {
  public: {
    Tables: {
      user_videos: {
        Row: {
          id: string
          user_id: string
          original_prompt: string
          enhanced_prompt: string
          video_url: string | null
          payment_id: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_prompt: string
          enhanced_prompt: string
          video_url?: string | null
          payment_id?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_prompt?: string
          enhanced_prompt?: string
          video_url?: string | null
          payment_id?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          stripe_payment_id: string
          amount: number
          status: 'pending' | 'completed' | 'failed'
          video_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_id: string
          amount: number
          status?: 'pending' | 'completed' | 'failed'
          video_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_id?: string
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
          video_id?: string | null
          created_at?: string
        }
      }
    }
  }
} 