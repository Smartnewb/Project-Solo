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
          created_at?: string
          updated_at?: string
          email?: string
          student_id?: string
          name?: string
          nickname?: string
          birth_date?: string
          gender?: string
          is_admin?: boolean
          profile_image?: string
          personality?: string[]
          dating_style?: string[]
          age_range_pref?: string
          lifestyle?: string[]
          matching_enabled?: boolean
          bio?: string
          interests?: string[]
          verified?: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email?: string
          student_id?: string
          name?: string
          nickname?: string
          birth_date?: string
          gender?: string
          is_admin?: boolean
          profile_image?: string
          personality?: string[]
          dating_style?: string[]
          age_range_pref?: string
          lifestyle?: string[]
          matching_enabled?: boolean
          bio?: string
          interests?: string[]
          verified?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          student_id?: string
          name?: string
          nickname?: string
          birth_date?: string
          gender?: string
          is_admin?: boolean
          profile_image?: string
          personality?: string[]
          dating_style?: string[]
          age_range_pref?: string
          lifestyle?: string[]
          matching_enabled?: boolean
          bio?: string
          interests?: string[]
          verified?: boolean
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          created_at?: string
          updated_at?: string
          preferred_personalities?: string[]
          preferred_dating_styles?: string[]
          preferred_lifestyles?: string[]
          preferred_interests?: string[]
          preferred_height_min?: number
          preferred_height_max?: number
          preferred_drinking?: string[]
          preferred_smoking?: string[]
          preferred_tattoo?: string[]
          preferred_mbti?: string[]
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          preferred_personalities?: string[]
          preferred_dating_styles?: string[]
          preferred_lifestyles?: string[]
          preferred_interests?: string[]
          preferred_height_min?: number
          preferred_height_max?: number
          preferred_drinking?: string[]
          preferred_smoking?: string[]
          preferred_tattoo?: string[]
          preferred_mbti?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          preferred_personalities?: string[]
          preferred_dating_styles?: string[]
          preferred_lifestyles?: string[]
          preferred_interests?: string[]
          preferred_height_min?: number
          preferred_height_max?: number
          preferred_drinking?: string[]
          preferred_smoking?: string[]
          preferred_tattoo?: string[]
          preferred_mbti?: string[]
        }
      }
      matchings: {
        Row: {
          id: string
          created_at: string
          user1_id: string
          user2_id: string
          status: 'pending' | 'evaluated' | 'completed' | 'cancelled'
          user1_decision: boolean | null
          user2_decision: boolean | null
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          user1_id: string
          user2_id: string
          status?: 'pending' | 'evaluated' | 'completed' | 'cancelled'
          user1_decision?: boolean | null
          user2_decision?: boolean | null
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          user1_id?: string
          user2_id?: string
          status?: 'pending' | 'evaluated' | 'completed' | 'cancelled'
          user1_decision?: boolean | null
          user2_decision?: boolean | null
          updated_at?: string
        }
      }
      offline_meetings: {
        Row: {
          id: string
          created_at: string
          inviter_id: string
          invitee_id: string
          meeting_date: string
          meeting_time: string
          status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          location: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          inviter_id: string
          invitee_id: string
          meeting_date: string
          meeting_time: string
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          location?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          inviter_id?: string
          invitee_id?: string
          meeting_date?: string
          meeting_time?: string
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          location?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          updated_at?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          data?: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          data?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          data?: Json
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at?: string
          title: string
          content: string
          user_id: string
          category: string
          nickname: string
          profile_image?: string
          likes: string[]
          comments: Json[]
          reports: Json[]
          isEdited: boolean
          isdeleted: boolean
          isBlinded: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          content: string
          user_id: string
          category: string
          nickname: string
          profile_image?: string
          likes?: string[]
          comments?: Json[]
          reports?: Json[]
          isEdited?: boolean
          isdeleted?: boolean
          isBlinded?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string
          user_id?: string
          category?: string
          nickname?: string
          profile_image?: string
          likes?: string[]
          comments?: Json[]
          reports?: Json[]
          isEdited?: boolean
          isdeleted?: boolean
          isBlinded?: boolean
        }
      }
      comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          post_id: string
          content: string
          is_anonymous: boolean
          parent_id: string | null
          likes_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          post_id: string
          content: string
          is_anonymous?: boolean
          parent_id?: string | null
          likes_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          post_id?: string
          content?: string
          is_anonymous?: boolean
          parent_id?: string | null
          likes_count?: number
        }
      }
      post_votes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          post_id: string
          value: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          post_id: string
          value: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          post_id?: string
          value?: number
        }
      }
      comment_votes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          comment_id: string
          value: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          comment_id: string
          value: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          comment_id?: string
          value?: number
        }
      }
      balance_games: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          question: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          question: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          question?: string
        }
      }
      balance_game_options: {
        Row: {
          id: string
          created_at: string
          game_id: string
          content: string
          is_option_a: boolean
          votes_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          game_id: string
          content: string
          is_option_a: boolean
          votes_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          game_id?: string
          content?: string
          is_option_a?: boolean
          votes_count?: number
        }
      }
      balance_game_votes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          game_id: string
          option_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          game_id: string
          option_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          game_id?: string
          option_id?: string
        }
      }
      daily_questions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          content: string
          response_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          content: string
          response_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          content?: string
          response_count?: number
        }
      }
      daily_question_responses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          question_id: string
          content: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          question_id: string
          content: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          question_id?: string
          content?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_vote_count: {
        Args: {
          option_id_param: string
        }
        Returns: undefined
      }
      decrement_vote_count: {
        Args: {
          option_id_param: string
        }
        Returns: undefined
      }
      increment_question_response_count: {
        Args: {
          question_id_param: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 