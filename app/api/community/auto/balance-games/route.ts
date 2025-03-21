import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// 밸런스 게임 목록 가져오기
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

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

  // 세션 확인 (선택 사항)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;

  try {
    // 밸런스 게임 목록 조회
    const { data: games, error, count } = await supabase
      .from('balance_games')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('밸런스 게임 조회 오류:', error);
      return NextResponse.json(
        { error: '밸런스 게임 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 옵션 정보 가져오기
    const formattedGames = await Promise.all(
      games.map(async (game: any) => {
        // 옵션 정보 가져오기
        const { data: options, error: optionsError } = await supabase
          .from('balance_game_options')
          .select('*')
          .eq('game_id', game.id);

        if (optionsError) {
          console.error('옵션 조회 오류:', optionsError);
          return game;
        }

        // 옵션별 투표 수 계산
        let totalVotes = 0;
        const formattedOptions = options.map((option: any) => {
          totalVotes += option.votes_count || 0;
          return option;
        });

        // 현재 사용자의 투표 정보 가져오기
        let userVote = null;
        if (userId) {
          const { data: voteData } = await supabase
            .from('balance_game_votes')
            .select('option_id')
            .eq('game_id', game.id)
            .eq('user_id', userId)
            .single();

          userVote = voteData?.option_id || null;
        }

        // 옵션 A, B 구분
        const optionA = formattedOptions.find((opt: any) => opt.is_option_a) || formattedOptions[0];
        const optionB = formattedOptions.find((opt: any) => !opt.is_option_a) || formattedOptions[1];

        return {
          ...game,
          option_a: optionA,
          option_b: optionB,
          total_votes: totalVotes,
          user_vote: userVote
        };
      })
    );

    return NextResponse.json({
      games: formattedGames,
      totalCount: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (err) {
    console.error('밸런스 게임 조회 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 밸런스 게임 투표하기
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { gameId, optionId } = body;

  if (!gameId || !optionId) {
    return NextResponse.json(
      { error: '게임 ID와 옵션 ID가 필요합니다.' },
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
    // 이미 투표했는지 확인
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('balance_game_votes')
      .select('id, option_id')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      console.error('투표 확인 오류:', voteCheckError);
      return NextResponse.json(
        { error: '투표 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 트랜잭션 시작 (원자적 업데이트를 위해)
    let result;

    if (existingVote) {
      // 이미 투표했으면 변경
      if (existingVote.option_id === optionId) {
        // 같은 옵션에 또 투표한 경우
        return NextResponse.json({ message: '이미 해당 옵션에 투표했습니다.' });
      }

      // 기존 투표 삭제
      const { error: removeVoteError } = await supabase
        .from('balance_game_votes')
        .delete()
        .eq('id', existingVote.id);

      if (removeVoteError) {
        throw removeVoteError;
      }

      // 기존 옵션의 투표 수 감소
      const { error: decreaseError } = await supabase.rpc('decrement_vote_count', {
        option_id_param: existingVote.option_id
      });

      if (decreaseError) {
        throw decreaseError;
      }

      // 새 투표 추가
      const { error: addVoteError } = await supabase
        .from('balance_game_votes')
        .insert({
          game_id: gameId,
          option_id: optionId,
          user_id: userId
        });

      if (addVoteError) {
        throw addVoteError;
      }

      // 새 옵션의 투표 수 증가
      const { error: increaseError } = await supabase.rpc('increment_vote_count', {
        option_id_param: optionId
      });

      if (increaseError) {
        throw increaseError;
      }

      result = { message: '투표가 변경되었습니다.' };
    } else {
      // 새로운 투표 추가
      const { error: addVoteError } = await supabase
        .from('balance_game_votes')
        .insert({
          game_id: gameId,
          option_id: optionId,
          user_id: userId
        });

      if (addVoteError) {
        throw addVoteError;
      }

      // 옵션의 투표 수 증가
      const { error: increaseError } = await supabase.rpc('increment_vote_count', {
        option_id_param: optionId
      });

      if (increaseError) {
        throw increaseError;
      }

      result = { message: '투표가 등록되었습니다.' };
    }

    // 최신 게임 정보 조회
    const { data: game, error: gameError } = await supabase
      .from('balance_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) {
      throw gameError;
    }

    // 옵션 정보 조회
    const { data: options, error: optionsError } = await supabase
      .from('balance_game_options')
      .select('*')
      .eq('game_id', gameId);

    if (optionsError) {
      throw optionsError;
    }

    // 옵션별 투표 수 계산
    let totalVotes = 0;
    options.forEach((option: any) => {
      totalVotes += option.votes_count || 0;
    });

    // 옵션 A, B 구분
    const optionA = options.find((opt: any) => opt.is_option_a) || options[0];
    const optionB = options.find((opt: any) => !opt.is_option_a) || options[1];

    // 결과 반환
    return NextResponse.json({
      ...result,
      game: {
        ...game,
        option_a: optionA,
        option_b: optionB,
        total_votes: totalVotes,
        user_vote: optionId
      }
    });
  } catch (err) {
    console.error('밸런스 게임 투표 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 