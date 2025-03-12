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
      profiles: {
        Row: {
          id: string
          created_at: string
          nickname: string
          student_id: string
          ideal_type: string[]
          mbti: string | null
          age: number | null
          gender: string | null
          department: string | null
          interests: string[]
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          nickname: string
          student_id: string
          ideal_type?: string[]
          mbti?: string | null
          age?: number | null
          gender?: string | null
          department?: string | null
          interests?: string[]
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          nickname?: string
          student_id?: string
          ideal_type?: string[]
          mbti?: string | null
          age?: number | null
          gender?: string | null
          department?: string | null
          interests?: string[]
          avatar_url?: string | null
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