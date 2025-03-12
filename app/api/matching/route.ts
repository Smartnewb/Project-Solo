import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    // 매칭 대기 중인 사용자 가져오기
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('matchStatus', 'waiting')
      .order('createdAt', { ascending: true });

    if (usersError) throw usersError;
    if (!users || users.length < 2) {
      return NextResponse.json({ message: '매칭 가능한 사용자가 부족합니다.' });
    }

    // 매칭 알고리즘
    const matches = [];
    const matched = new Set();

    for (let i = 0; i < users.length; i++) {
      if (matched.has(users[i].id)) continue;

      for (let j = i + 1; j < users.length; j++) {
        if (matched.has(users[j].id)) continue;

        // 매칭 조건 확인
        if (
          users[i].gender !== users[j].gender && // 다른 성별
          Math.abs(users[i].age - users[j].age) <= 3 // 나이 차이 3살 이내
        ) {
          matches.push({
            userId1: users[i].id,
            userId2: users[j].id,
            status: 'pending',
            matchedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
          });

          matched.add(users[i].id);
          matched.add(users[j].id);
          break;
        }
      }
    }

    // 매칭 결과 저장
    if (matches.length > 0) {
      const { error: matchError } = await supabase
        .from('matches')
        .insert(matches);

      if (matchError) throw matchError;

      // 매칭된 사용자 상태 업데이트
      const matchedUsers = Array.from(matched);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ matchStatus: 'matched' })
        .in('id', matchedUsers);

      if (updateError) throw updateError;
    }

    return NextResponse.json({
      message: `${matches.length}쌍의 매칭이 완료되었습니다.`,
      matches,
    });
  } catch (error) {
    console.error('Matching error:', error);
    return NextResponse.json(
      { error: '매칭 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 