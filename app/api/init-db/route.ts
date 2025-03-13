import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables for Supabase connection');
    }

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

    // 1. profiles 테이블 생성
    const { error: profilesError } = await supabase.rpc('create_profiles_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
          role TEXT DEFAULT 'user',
          nickname TEXT,
          university TEXT,
          department TEXT,
          height INTEGER,
          mbti TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
        
        -- 기본 관리자 프로필 생성
        INSERT INTO profiles (id, role, nickname, university, department)
        VALUES (
          '00000000-0000-0000-0000-000000000000',
          'admin',
          '관리자',
          '한밭대학교',
          '시스템관리'
        ) ON CONFLICT (id) DO NOTHING;
      `
    });

    if (profilesError) throw profilesError;

    // 2. matches 테이블 생성
    const { error: matchesError } = await supabase.rpc('create_matches_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS matches (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user1_id UUID REFERENCES profiles(id),
          user2_id UUID REFERENCES profiles(id),
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
      `
    });

    if (matchesError) throw matchesError;

    // 3. posts 테이블 생성
    const { error: postsError } = await supabase.rpc('create_posts_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          author_id UUID REFERENCES profiles(id),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
      `
    });

    if (postsError) throw postsError;

    // 4. comments 테이블 생성
    const { error: commentsError } = await supabase.rpc('create_comments_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS comments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          author_id UUID REFERENCES profiles(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
      `
    });

    if (commentsError) throw commentsError;

    // 5. reports 테이블 생성
    const { error: reportsError } = await supabase.rpc('create_reports_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS reports (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          reporter_id UUID REFERENCES profiles(id),
          reported_id UUID REFERENCES profiles(id),
          reason TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
      `
    });

    if (reportsError) throw reportsError;

    // 6. 샘플 데이터 생성
    const { error: sampleDataError } = await supabase.rpc('create_sample_data', {
      sql: `
        -- 샘플 사용자 프로필
        INSERT INTO profiles (id, role, nickname, university, department, height, mbti)
        VALUES 
          (uuid_generate_v4(), 'user', '김철수', '한밭대학교', '컴퓨터공학과', 175, 'ISTJ'),
          (uuid_generate_v4(), 'user', '이영희', '한밭대학교', '정보통신공학과', 162, 'ENFP'),
          (uuid_generate_v4(), 'user', '박지민', '한밭대학교', '전기공학과', 180, 'ENTJ')
        ON CONFLICT (id) DO NOTHING;

        -- 샘플 게시글
        INSERT INTO posts (author_id, title, content)
        SELECT 
          id,
          '안녕하세요, 처음 가입했습니다!',
          '한밭대학교 재학생입니다. 잘 부탁드려요 :)'
        FROM profiles
        WHERE nickname = '김철수'
        LIMIT 1;
      `
    });

    if (sampleDataError) throw sampleDataError;

    return NextResponse.json({
      message: '데이터베이스 초기화가 완료되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('데이터베이스 초기화 중 에러 발생:', error);
    return NextResponse.json({
      error: '데이터베이스 초기화 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 