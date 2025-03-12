import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: '환경 변수가 설정되지 않았습니다.',
        status: 'error'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 테이블 존재 여부 확인
    const tables = ['profiles', 'user_preferences', 'matching_requests', 'matches'];
    const tableChecks = await Promise.all(
      tables.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        return {
          table,
          exists: !error,
          error: error ? error.message : null
        };
      })
    );

    // RLS 정책 확인 (profiles 테이블에 대해서만)
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'profiles' });

    return NextResponse.json({
      status: 'success',
      tables: tableChecks,
      policies: policies || [],
      policiesError: policiesError?.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      status: 'error'
    }, { status: 500 });
  }
} 