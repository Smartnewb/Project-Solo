export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  university: string;
  bio: string;
  hobbies?: string[];
  mbti?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  matchedAt: Date;
  expiresAt: Date;
}

export interface MatchStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
} 