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
          is_admin: boolean
          personalities?: string[]
          dating_styles?: string[]
          ideal_lifestyles?: string[]
          interests?: string[]
          height?: number
          drinking?: string
          smoking?: string
          tattoo?: string
          mbti?: string
          university?: string
          department?: string
          grade?: string
          instagram_id?: string
          username?: string
          avatar_url?: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email?: string
          is_admin?: boolean
          personalities?: string[]
          dating_styles?: string[]
          ideal_lifestyles?: string[]
          interests?: string[]
          height?: number
          drinking?: string
          smoking?: string
          tattoo?: string
          mbti?: string
          university?: string
          department?: string
          grade?: string
          instagram_id?: string
          username?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          is_admin?: boolean
          personalities?: string[]
          dating_styles?: string[]
          ideal_lifestyles?: string[]
          interests?: string[]
          height?: number
          drinking?: string
          smoking?: string
          tattoo?: string
          mbti?: string
          university?: string
          department?: string
          grade?: string
          instagram_id?: string
          username?: string
          avatar_url?: string
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
          user_id: string
          content: string
          type: 'meeting_invitation' | 'meeting_confirmed' | 'meeting_cancelled' | 'system'
          related_id: string | null
          is_read: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          content: string
          type: 'meeting_invitation' | 'meeting_confirmed' | 'meeting_cancelled' | 'system'
          related_id?: string | null
          is_read?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          content?: string
          type?: 'meeting_invitation' | 'meeting_confirmed' | 'meeting_cancelled' | 'system'
          related_id?: string | null
          is_read?: boolean
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          content: string
          category: string
          is_anonymous: boolean
          likes_count: number
          comments_count: number
          views_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          content: string
          category: string
          is_anonymous?: boolean
          likes_count?: number
          comments_count?: number
          views_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          content?: string
          category?: string
          is_anonymous?: boolean
          likes_count?: number
          comments_count?: number
          views_count?: number
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
  }
} 