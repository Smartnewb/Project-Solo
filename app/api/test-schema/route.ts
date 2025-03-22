import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  try {
    // 쿠키에서 Supabase 클라이언트 생성
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
            } catch {
              // 서버 컴포넌트에서 호출된 경우 무시
            }
          },
        },
      }
    );

    // 테이블 존재 여부 확인
    const tables = [
      { table: 'profiles', exists: false, error: null as string | null },
      { table: 'posts', exists: false, error: null as string | null },
      { table: 'comments', exists: false, error: null as string | null },
      { table: 'post_votes', exists: false, error: null as string | null },
      { table: 'comment_votes', exists: false, error: null as string | null },
      { table: 'notifications', exists: false, error: null as string | null }
    ];

    // 각 테이블 확인
    for (let i = 0; i < tables.length; i++) {
      try {
        const { count, error } = await supabase
          .from(tables[i].table)
          .select('*', { count: 'exact', head: true });
        
        tables[i].exists = !error;
        if (error) {
          tables[i].error = error.message;
        }
      } catch (err: any) {
        tables[i].error = err.message;
      }
    }

    return NextResponse.json({
      tables,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '스키마 확인 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
} 