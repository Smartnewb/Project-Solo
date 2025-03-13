import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // profiles 테이블 스키마 수정
    await supabase.from('profiles').select('*');
    
    const { error } = await supabase.rpc('alter_profiles_table');
    
    if (error) throw error;
    
    return NextResponse.json({ message: '스키마 업데이트 완료' });
  } catch (error) {
    console.error('스키마 업데이트 실패:', error);
    return NextResponse.json({ error: '스키마 업데이트 실패' }, { status: 500 });
  }
} 