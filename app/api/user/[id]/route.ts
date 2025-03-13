import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('환경 변수 확인:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '존재함' : '없음'
    });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables for Supabase connection');
    }

    // 서비스 롤 키로 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('조회하려는 사용자 ID:', params.id);

    // 프로필 정보 조회
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (profileError) {
      console.error('프로필 조회 에러:', profileError);
      return NextResponse.json({ 
        error: '프로필 조회 실패',
        details: profileError.message 
      }, { status: 400 });
    }

    // 매칭 정보 조회
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${params.id},user2_id.eq.${params.id}`);

    if (matchesError) {
      console.error('매칭 정보 조회 실패:', matchesError);
    }

    // 결과 반환
    return new NextResponse(
      JSON.stringify({
        profile: profileData || null,
        matches: matchesData || [],
        message: '조회 완료',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('사용자 정보 조회 중 에러 발생:', error);
    return new NextResponse(
      JSON.stringify({
        error: '사용자 정보 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 