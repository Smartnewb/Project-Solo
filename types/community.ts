export enum PostCategory {
  QUESTIONS = 'questions',
  DATING_REVIEWS = 'dating_reviews',
  MATCHING_REVIEWS = 'matching_reviews',
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: PostCategory;
  nickname: string;
  profile_image?: string;
  likes: string[];
  comments: any[];
  reports: any[];
  isEdited: boolean;
  isdeleted: boolean;
  isBlinded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    nickname: string;
    image_url?: string;
  };
  is_mine?: boolean;
}

export interface BalanceGameOption {
  id: string;
  game_id: string;
  content: string;
  votes_count: number;
}

export interface BalanceGame {
  id: string;
  question: string;
  option_a: BalanceGameOption;
  option_b: BalanceGameOption;
  created_at: string;
  total_votes: number;
}

export interface DailyQuestion {
  id: string;
  question: string;
  created_at: string;
  comments_count: number;
}

export interface PostVote {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentVote {
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface BalanceGameVote {
  game_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}
