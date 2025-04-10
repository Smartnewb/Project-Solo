export interface Profile {
  id: string;
  role?: string;
  nickname: string;
  bio?: string;
  university: string;
  department?: string;
  major?: string;
  age?: number;
  gender?: 'male' | 'female';
  height: string | number;
  mbti: string;
  interests?: string[];
  personalities?: string[];
  datingStyles?: string[];
  lifestyles?: string[];
  drinking?: string;
  smoking?: string;
  tattoo?: string;
  photos?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_age_min: number;
  preferred_age_max: number;
  preferred_age_type: 'older' | 'younger' | 'same' | 'any';
  preferred_height_min: string;
  preferred_height_max: string;
  preferred_mbti: string[];
  created_at: string;
  updated_at: string;
}

export interface MatchingRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'matched' | 'cancelled';
  preferred_date: string;
  preferred_time: string;
  location_preference: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  match_date: string;
  match_time: string;
  location: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  signup_enabled: boolean;
  matching_datetime: string | null;
  updated_at: string;
  created_at: string;
}
