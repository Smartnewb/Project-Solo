import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
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

// Supabase 쿼리 결과 타입 정의
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
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // 사용자 프로필 정보 가져오기
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, nickname')
    .eq('user_id', user.id)
    .single();
    
  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }
  
  // 매칭 정보 가져오기
  const { data: matchings, error } = await supabase
    .from('matchings')
    .select(`
      id,
      user_id,
      matched_user_id,
      status,
      created_at,
      updated_at,
      user_decision,
      score,
      compatibility_reasons,
      matched_user:matched_user_id (
        id,
        user_id,
        nickname,
        age,
        gender,
        department,
        mbti,
        height,
        personalities,
        dating_styles,
        interests,
        avatar_url,
        instagram_id,
        university,
        grade,
        drinking,
        smoking,
        tattoo,
        lifestyles
      )
    `)
    .eq('user_id', user.id);
    
  if (error) {
    console.error('Error fetching matchings:', error);
  }
  
  // 매칭 데이터 변환 (타입스크립트 오류 해결)
  const formattedMatchings = (matchings || []).map((matching: Matching) => {
    // 타입스크립트 컴파일러가 배열로 인식하는 문제를 해결하기 위한 로직
    let matchedUser: Record<string, any> = {};
    
    // matched_user가 배열인 경우 첫 번째 항목을 사용
    if (Array.isArray(matching.matched_user) && matching.matched_user.length > 0) {
      matchedUser = matching.matched_user[0];
    } 
    // matched_user가 객체인 경우 그대로 사용
    else if (matching.matched_user && typeof matching.matched_user === 'object') {
      matchedUser = matching.matched_user as Record<string, any>;
    }
    
    // 필요한 속성이 없을 경우 기본값 사용
    const matchedUserData = {
      id: matchedUser?.id || '',
      user_id: matchedUser?.user_id || '',
      nickname: matchedUser?.nickname || '',
      age: matchedUser?.age || 0,
      gender: matchedUser?.gender || '',
      department: matchedUser?.department || '',
      mbti: matchedUser?.mbti || '',
      height: matchedUser?.height || 0,
      personalities: matchedUser?.personalities || [],
      dating_styles: matchedUser?.dating_styles || [],
      interests: matchedUser?.interests || [],
      avatar_url: matchedUser?.avatar_url || '',
      instagram_id: matchedUser?.instagram_id || '',
      university: matchedUser?.university || '',
      grade: matchedUser?.grade || '',
      drinking: matchedUser?.drinking || '',
      smoking: matchedUser?.smoking || '',
      tattoo: matchedUser?.tattoo || '',
      lifestyles: matchedUser?.lifestyles || []
    };
    
    return {
      id: matching.id,
      user_id: matching.user_id,
      matched_user_id: matching.matched_user_id,
      status: matching.status,
      created_at: matching.created_at,
      updated_at: matching.updated_at,
      userDecision: matching.user_decision,
      score: matching.score,
      compatibility_reasons: matching.compatibility_reasons || [],
      matchedUser: matchedUserData
    };
  });
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">매칭 결과</h1>
      <MatchingResultClient 
        matchings={formattedMatchings}
        userId={user.id}
        username={profile?.nickname || user.email?.split('@')[0] || '익명 사용자'} 
      />
    </div>
  );
} 