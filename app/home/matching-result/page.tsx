import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import dynamic from 'next/dynamic';

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

  // 사용자 세션 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">매칭 결과</h1>
        <p className="mb-4">로그인이 필요한 서비스입니다.</p>
        <div className="mt-4">
          <Link 
            href="/login" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  // 사용자의 매칭 정보 가져오기
  const { data: matchings, error } = await supabase
    .from('matchings')
    .select(`
      *,
      user1: profiles!matchings_user1_id_fkey(*),
      user2: profiles!matchings_user2_id_fkey(*)
    `)
    .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('매칭 데이터 로드 에러:', error);
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">매칭 결과</h1>
        <p className="text-red-500">매칭 정보를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  // 매칭 데이터 가공
  const processedMatchings = matchings.map(matching => {
    const isUser1 = matching.user1_id === session.user.id;
    const currentUserProfile = isUser1 ? matching.user1 : matching.user2;
    const matchedUserProfile = isUser1 ? matching.user2 : matching.user1;
    const userDecision = isUser1 ? matching.user1_decision : matching.user2_decision;
    const matchedUserDecision = isUser1 ? matching.user2_decision : matching.user1_decision;

    return {
      id: matching.id,
      status: matching.status,
      created_at: matching.created_at,
      updated_at: matching.updated_at,
      userDecision,
      matchedUserDecision,
      matchedUser: {
        id: matchedUserProfile.id,
        user_id: matchedUserProfile.user_id,
        nickname: matchedUserProfile.nickname || '익명',
        age: matchedUserProfile.age,
        gender: matchedUserProfile.gender,
        department: matchedUserProfile.department,
        mbti: matchedUserProfile.mbti,
        height: matchedUserProfile.height,
        personalities: matchedUserProfile.personalities || [],
        dating_styles: matchedUserProfile.dating_styles || [],
        interests: matchedUserProfile.interests || [],
        avatar_url: matchedUserProfile.avatar_url,
        instagram_id: matchedUserProfile.instagram_id
      }
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">매칭 결과</h1>
      <MatchingResultClient matchings={processedMatchings} userId={session.user.id} />
    </div>
  );
} 