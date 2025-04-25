import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

// 정적 생성에서 동적 렌더링으로 전환
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';

// 클라이언트 컴포넌트 동적 임포트 (이름 변경)
const MatchingResultClient = NextDynamic(() => import('./MatchingResultClient'), { ssr: false });

// 매치 사용자 타입 정의
interface MatchedUser {
  id: string;
  user_id: string;
  nickname: string;
  age: number;
  gender: string;
  department: string;
  mbti: string;
  height: number;
  personalities: string[];
  dating_styles: string[];
  interests: string[];
  avatar_url: string;
  instagram_id: string;
  university: string;
  grade: string;
  drinking: string;
  smoking: string;
  tattoo: string;
  lifestyles: string[];
}

interface Matching {
  id: string;
  user_id: string;
  matched_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_decision: boolean | null;
  score: number;
  compatibility_reasons: string[];
  // 명시적으로 any 타입으로 정의하여 타입 체크 오류 방지
  matched_user: any;
}

export default async function MatchingResult() {
  return (
    <div className="container mx-auto py-8 px-4">
      ㅋㅋㅋ
    </div>
  );
} 