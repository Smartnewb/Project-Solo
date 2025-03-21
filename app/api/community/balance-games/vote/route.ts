import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/community/balance-games/vote
 * 밸런스 게임에 투표합니다.
 * 요청 바디:
 * - game_id: 게임 ID (필수)
 * - option_id: 선택한 옵션 ID (필수)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { game_id, option_id } = body;

  // 필수 파라미터 확인
  if (!game_id) {
    return NextResponse.json(
      { error: '게임 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  if (!option_id) {
    return NextResponse.json(
      { error: '옵션 ID가 필요합니다.' },
      { status: 400 }
    );
  }

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

  // 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 인증되지 않은 사용자에게는 오류 응답
  if (!session) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // 게임 존재 여부 확인
    const { data: game, error: gameError } = await supabase
      .from('balance_games')
      .select('id')
      .eq('id', game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: '해당 밸런스 게임을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 옵션 존재 여부 및 게임에 속하는지 확인
    const { data: option, error: optionError } = await supabase
      .from('balance_game_options')
      .select('id, game_id')
      .eq('id', option_id)
      .single();

    if (optionError || !option) {
      return NextResponse.json(
        { error: '해당 옵션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (option.game_id !== game_id) {
      return NextResponse.json(
        { error: '해당 옵션은 이 게임에 속하지 않습니다.' },
        { status: 400 }
      );
    }

    // 이미 투표했는지 확인
    const { data: existingVote, error: voteError } = await supabase
      .from('balance_game_votes')
      .select('id, option_id')
      .eq('game_id', game_id)
      .eq('user_id', userId)
      .maybeSingle();

    // 기존 투표가 있으면 변경 처리
    if (existingVote) {
      // 같은 옵션에 투표한 경우
      if (existingVote.option_id === option_id) {
        return NextResponse.json(
          { error: '이미 이 옵션에 투표했습니다.' },
          { status: 400 }
        );
      }

      // 다른 옵션으로 변경하는 경우: 이전 옵션의 투표수 감소
      const { data: prevOption } = await supabase
        .from('balance_game_options')
        .select('id')
        .eq('id', existingVote.option_id)
        .single();

      if (prevOption) {
        await supabase
          .from('balance_game_options')
          .update({ votes_count: supabase.rpc('decrement', { dec: 1 }) })
          .eq('id', existingVote.option_id);
      }

      // 투표 업데이트
      const { data: updatedVote, error: updateError } = await supabase
        .from('balance_game_votes')
        .update({
          option_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (updateError) {
        console.error('투표 업데이트 오류:', updateError);
        return NextResponse.json(
          { error: '투표를 업데이트하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // 새 옵션의 투표수 증가
      await supabase
        .from('balance_game_options')
        .update({ votes_count: supabase.rpc('increment', { inc: 1 }) })
        .eq('id', option_id);

      return NextResponse.json({
        message: '투표가 성공적으로 변경되었습니다.',
        data: updatedVote
      });
    }

    // 새 투표 생성
    const { data: vote, error } = await supabase
      .from('balance_game_votes')
      .insert({
        game_id,
        option_id,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('투표 생성 오류:', error);
      return NextResponse.json(
        { error: '투표를 생성하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 옵션의 투표수 증가
    await supabase
      .from('balance_game_options')
      .update({ votes_count: supabase.rpc('increment', { inc: 1 }) })
      .eq('id', option_id);

    // 게임의 총 투표수 증가
    await supabase
      .from('balance_games')
      .update({ votes_count: supabase.rpc('increment', { inc: 1 }) })
      .eq('id', game_id);

    return NextResponse.json({
      message: '투표가 성공적으로 추가되었습니다.',
      data: vote
    });
  } catch (err) {
    console.error('투표 추가 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/balance-games/vote
 * 밸런스 게임 투표를 취소합니다.
 * query params:
 * - game_id: 게임 ID (필수)
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get('game_id');

  if (!gameId) {
    return NextResponse.json(
      { error: '게임 ID가 필요합니다.' },
      { status: 400 }
    );
  }

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

  // 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 인증되지 않은 사용자에게는 오류 응답
  if (!session) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // 투표 존재 여부 확인
    const { data: vote, error: voteError } = await supabase
      .from('balance_game_votes')
      .select('id, option_id')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!vote) {
      return NextResponse.json(
        { error: '해당 게임에 투표한 기록이 없습니다.' },
        { status: 404 }
      );
    }

    // 옵션의 투표수 감소
    if (vote.option_id) {
      await supabase
        .from('balance_game_options')
        .update({ votes_count: supabase.rpc('decrement', { dec: 1 }) })
        .eq('id', vote.option_id);
    }

    // 투표 삭제
    const { error } = await supabase
      .from('balance_game_votes')
      .delete()
      .eq('id', vote.id);

    if (error) {
      console.error('투표 삭제 오류:', error);
      return NextResponse.json(
        { error: '투표를 삭제하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 게임의 총 투표수 감소
    await supabase
      .from('balance_games')
      .update({ votes_count: supabase.rpc('decrement', { dec: 1 }) })
      .eq('id', gameId);

    return NextResponse.json({
      message: '투표가 성공적으로 취소되었습니다.'
    });
  } catch (err) {
    console.error('투표 취소 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 