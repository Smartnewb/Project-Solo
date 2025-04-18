export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          post_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["userId"]
          },
        ]
      }
      female_profiles: {
        Row: {
          age: number | null
          classification: string | null
          created_at: string | null
          gender: string | null
          id: string
          instagramid: string | null
          name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          classification?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          instagramid?: string | null
          name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          classification?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          instagramid?: string | null
          name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      male_profiles: {
        Row: {
          age: number | null
          classification: string | null
          created_at: string | null
          gender: string | null
          id: string
          instagramid: string | null
          name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          classification?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          instagramid?: string | null
          name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          classification?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          instagramid?: string | null
          name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          match_date: string | null
          match_time: string | null
          status: string | null
          updated_at: string | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_date?: string | null
          match_time?: string | null
          status?: string | null
          updated_at?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_date?: string | null
          match_time?: string | null
          status?: string | null
          updated_at?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_requests: {
        Row: {
          created_at: string | null
          id: string
          preferred_date: string | null
          preferred_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          emoji: string | null
          isdeleted: boolean | null
          isedited: boolean | null
          isEdited: boolean | null
          likes: string[] | null
          nickname: string | null
          reports: string[] | null
          studentid: string | null
          timestamp: string | null
          updated_at: string | null
          userId: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          emoji?: string | null
          isdeleted?: boolean | null
          isedited?: boolean | null
          isEdited?: boolean | null
          likes?: string[] | null
          nickname?: string | null
          reports?: string[] | null
          studentid?: string | null
          timestamp?: string | null
          updated_at?: string | null
          userId?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          emoji?: string | null
          isdeleted?: boolean | null
          isedited?: boolean | null
          isEdited?: boolean | null
          likes?: string[] | null
          nickname?: string | null
          reports?: string[] | null
          studentid?: string | null
          timestamp?: string | null
          updated_at?: string | null
          userId?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          classification: string | null
          created_at: string | null
          dating_styles: string | null
          department: string | null
          drinking: string | null
          gender: string | null
          grade: string | null
          id: string
          instagram_id: string | null
          interests: string | null
          is_admin: boolean | null
          lifestyles: string | null
          name: string | null
          personalities: string | null
          role: string | null
          smoking: string | null
          student_id: string | null
          tattoo: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          classification?: string | null
          created_at?: string | null
          dating_styles?: string | null
          department?: string | null
          drinking?: string | null
          gender?: string | null
          grade?: string | null
          id?: string
          instagram_id?: string | null
          interests?: string | null
          is_admin?: boolean | null
          lifestyles?: string | null
          name?: string | null
          personalities?: string | null
          role?: string | null
          smoking?: string | null
          student_id?: string | null
          tattoo?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          classification?: string | null
          created_at?: string | null
          dating_styles?: string | null
          department?: string | null
          drinking?: string | null
          gender?: string | null
          grade?: string | null
          id?: string
          instagram_id?: string | null
          interests?: string | null
          is_admin?: boolean | null
          lifestyles?: string | null
          name?: string | null
          personalities?: string | null
          role?: string | null
          smoking?: string | null
          student_id?: string | null
          tattoo?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          reported_id: string | null
          reporter_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          matching_datetime: string | null
          signup_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          matching_datetime?: string | null
          signup_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          matching_datetime?: string | null
          signup_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          preferred_age_type: string[] | null
          preferred_days: string[] | null
          preferred_drinking: string | null
          preferred_genres: string[] | null
          preferred_height_max: string | null
          preferred_height_min: string | null
          preferred_height_type: string | null
          preferred_mbti: string | null
          preferred_smoking: string | null
          preferred_tattoo: string | null
          preferred_times: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferred_age_type?: string[] | null
          preferred_days?: string[] | null
          preferred_drinking?: string | null
          preferred_genres?: string[] | null
          preferred_height_max?: string | null
          preferred_height_min?: string | null
          preferred_height_type?: string | null
          preferred_mbti?: string | null
          preferred_smoking?: string | null
          preferred_tattoo?: string | null
          preferred_times?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preferred_age_type?: string[] | null
          preferred_days?: string[] | null
          preferred_drinking?: string | null
          preferred_genres?: string[] | null
          preferred_height_max?: string | null
          preferred_height_min?: string | null
          preferred_height_type?: string | null
          preferred_mbti?: string | null
          preferred_smoking?: string | null
          preferred_tattoo?: string | null
          preferred_times?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      alter_profiles_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_profile: {
        Args: {
          p_user_id: string
          p_name: string
          p_student_id: string
          p_grade: string
          p_university: string
          p_department: string
          p_instagram_id: string
          p_avatar_url: string
          p_age?: number
          p_gender?: string
          p_classification?: string
        }
        Returns: Json
      }
      create_system_settings_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_initial_admin: {
        Args: Record<PropertyKey, never>
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
