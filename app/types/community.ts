export enum PostCategory {
  ADVICE = 'advice', // 연애 고민 상담소
  REVIEW = 'review', // 소개팅 후기
  TIPS = 'tips',    // 연애 & 소개팅 꿀팁
  BALANCE = 'balance', // 연애 밸런스 게임
  DAILY = 'daily'   // 오늘의 연애 질문
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: PostCategory;
  is_anonymous: boolean;
  is_auto_generated?: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    nickname: string;
    image_url?: string;
  };
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