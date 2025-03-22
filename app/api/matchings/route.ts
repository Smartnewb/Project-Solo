import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
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

    // 사용자 인증 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('세션 에러:', sessionError.message);
      return NextResponse.json({ error: '인증 오류가 발생했습니다.' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;

    // 사용자 매칭 정보 조회
    const { data: matchings, error: matchingsError } = await supabase
      .from('matchings')
      .select(`
        *,
        user1: profiles!matchings_user1_id_fkey(*),
        user2: profiles!matchings_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (matchingsError) {
      console.error('매칭 정보 조회 에러:', matchingsError.message);
      return NextResponse.json({ error: '매칭 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      matchings: matchings.map(matching => {
        // 본인 정보와 상대방 정보 구분
        const isUser1 = matching.user1_id === userId;
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
      })
    });

  } catch (error) {
    console.error('매칭 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 