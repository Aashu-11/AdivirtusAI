export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leadership_responses: {
        Row: {
          id: number
          user_id: string
          assessment_id: string
          answers: Json
          neutral_count: number
          completed_at: string
        }
        Insert: {
          id?: number
          user_id: string
          assessment_id?: string
          answers: Json
          neutral_count: number
          completed_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          assessment_id?: string
          answers?: Json
          neutral_count?: number
          completed_at?: string
        }
      }
      peer_leadership_responses: {
        Row: {
          id: number
          user_id: string
          target_user_id: string
          assessment_id: string
          answers: Json
          neutral_count: number
          completed_at: string
        }
        Insert: {
          id?: number
          user_id: string
          target_user_id: string
          assessment_id?: string
          answers: Json
          neutral_count: number
          completed_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          target_user_id?: string
          assessment_id?: string
          answers?: Json
          neutral_count?: number
          completed_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          role: string | null
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          role?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          role?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 