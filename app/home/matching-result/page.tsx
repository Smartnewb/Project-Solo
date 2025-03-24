import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

// 클라이언트 컴포넌트 동적 임포트
const MatchingResultClient = dynamic(() => import('./MatchingResultClient'), { ssr: false });

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
  
  // 매칭 데이터 변환
  const formattedMatchings = (matchings || []).map(matching => ({
    id: matching.id,
    user_id: matching.user_id,
    matched_user_id: matching.matched_user_id,
    status: matching.status,
    created_at: matching.created_at,
    updated_at: matching.updated_at,
    userDecision: matching.user_decision,
    score: matching.score,
    compatibility_reasons: matching.compatibility_reasons,
    matchedUser: {
      id: matching.matched_user?.id,
      user_id: matching.matched_user?.user_id,
      nickname: matching.matched_user?.nickname,
      age: matching.matched_user?.age,
      gender: matching.matched_user?.gender,
      department: matching.matched_user?.department,
      mbti: matching.matched_user?.mbti,
      height: matching.matched_user?.height,
      personalities: matching.matched_user?.personalities,
      dating_styles: matching.matched_user?.dating_styles,
      interests: matching.matched_user?.interests,
      avatar_url: matching.matched_user?.avatar_url,
      instagram_id: matching.matched_user?.instagram_id,
      university: matching.matched_user?.university,
      grade: matching.matched_user?.grade,
      drinking: matching.matched_user?.drinking,
      smoking: matching.matched_user?.smoking,
      tattoo: matching.matched_user?.tattoo,
      lifestyles: matching.matched_user?.lifestyles
    }
  }));
  
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