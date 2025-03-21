import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// 자동 컨텐츠 생성 API (관리자용)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    generateQuestions = false,
    generateBalanceGames = false,
    questionCount = 1,
    balanceGameCount = 1
  } = body;

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

  // 관리자 권한 확인
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile?.is_admin) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    const results: {
      generatedQuestions: any[];
      generatedBalanceGames: any[];
    } = {
      generatedQuestions: [],
      generatedBalanceGames: []
    };

    // 오늘의 질문 생성
    if (generateQuestions && questionCount > 0) {
      results.generatedQuestions = await generateDailyQuestions(supabase, questionCount);
    }

    // 밸런스 게임 생성
    if (generateBalanceGames && balanceGameCount > 0) {
      results.generatedBalanceGames = await generateBalanceGames(supabase, balanceGameCount);
    }

    return NextResponse.json({
      message: '컨텐츠가 성공적으로 생성되었습니다.',
      results
    });
  } catch (err) {
    console.error('컨텐츠 생성 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 오늘의 질문 생성 함수
async function generateDailyQuestions(
  supabase: any, 
  count = 1
): Promise<any[]> {
  const dailyQuestions = [
    "첫 데이트에서 가장 중요하게 생각하는 것은 무엇인가요?",
    "연인과의 다툼에서 가장 효과적인 화해 방법은 무엇인가요?",
    "이상형과 실제 만난 사람 사이에 차이가 있었나요?",
    "데이트 중 가장 당황스러웠던 순간은 언제인가요?",
    "연애할 때 절대 타협할 수 없는 가치관은 무엇인가요?",
    "상대방의 어떤 작은 습관이 사랑스럽게 느껴지나요?",
    "장거리 연애를 성공시키는 비결이 있다면 무엇일까요?",
    "소개팅과 앱 매칭 중 어떤 방식을 선호하나요? 이유는?",
    "연인에게 거짓말을 한 적이 있나요? 그 이유는 무엇이었나요?",
    "가장 기억에 남는 프로포즈 방식은 무엇인가요?",
    "연애와 우정 사이에서 갈등이 생겼을 때 어떻게 해결하나요?",
    "상대방의 어떤 모습에서 결혼할 사람이라고 확신이 들었나요?",
    "사랑과 우정의 경계는 무엇이라고 생각하나요?",
    "이별 후 가장 효과적인 극복 방법은 무엇인가요?",
    "연인과 공유하는 취미가 있나요? 없다면 어떤 취미를 함께하고 싶나요?",
    "사랑을 유지하기 위해 가장 중요한 요소는 무엇이라고 생각하나요?",
    "이상적인 프로포즈는 어떤 모습인가요?",
    "연인의 친구들과 어울리는 것이 중요하다고 생각하나요?",
    "상대방의 전 연인에 대해 알고 싶은가요? 이유는?",
    "연애에서 가장 중요한 것은 외모, 성격, 가치관 중 무엇인가요?",
    "데이트 비용은 어떻게 나누는 것이 좋다고 생각하나요?",
    "연인의 SNS 사용 습관이 관계에 영향을 미치나요?",
    "결혼할 때 가장 중요하게 고려해야 할 점은 무엇인가요?",
    "신혼여행으로 가고 싶은 곳과 그 이유는?",
    "나이 차이는 연애에 영향을 미친다고 생각하나요?",
    "상대방의 가족들과 좋은 관계를 유지하는 것이 중요한가요?",
    "연인과 함께 살면서 가장 어려웠던 점은 무엇인가요?",
    "연애를 시작했을 때와 현재의 연애 스타일에 변화가 있나요?",
    "연인이 변화를 원할 때 어디까지 수용할 수 있나요?",
    "평생 함께하고 싶은 연인의 모습은 어떤 모습인가요?"
  ];

  // 이미 사용된 질문 필터링
  const { data: existingQuestions } = await supabase
    .from('daily_questions')
    .select('content')
    .order('created_at', { ascending: false })
    .limit(30);

  const usedQuestions = new Set(existingQuestions?.map((q: { content: string }) => q.content) || []);
  const availableQuestions = dailyQuestions.filter(q => !usedQuestions.has(q));

  // 새로운 질문이 부족하면 배열에서 랜덤하게 선택
  let questionsToUse: string[] = [];
  if (availableQuestions.length >= count) {
    // 충분한 새 질문이 있는 경우
    questionsToUse = availableQuestions.slice(0, count);
  } else {
    // 새 질문이 부족한 경우 중복 허용하여 선택
    questionsToUse = [...availableQuestions];
    const remainingCount = count - availableQuestions.length;
    
    for (let i = 0; i < remainingCount; i++) {
      const randomIndex = Math.floor(Math.random() * dailyQuestions.length);
      questionsToUse.push(dailyQuestions[randomIndex]);
    }
  }

  // 질문 생성 및 DB 저장
  const createdQuestions: any[] = [];
  for (const question of questionsToUse) {
    const { data, error } = await supabase
      .from('daily_questions')
      .insert({
        content: question,
        response_count: 0
      })
      .select();

    if (!error && data) {
      createdQuestions.push(data[0]);
    }
  }

  return createdQuestions;
}

// 밸런스 게임 생성 함수
async function generateBalanceGames(
  supabase: any, 
  count = 1
): Promise<any[]> {
  const balanceGames = [
    {
      question: "연인과 함께하는 여행, 계획적인 일정 vs 즉흥적인 여행?",
      optionA: "모든 일정과 숙소가 미리 계획된 여행",
      optionB: "목적지만 정하고 계획 없이 즉흥적으로 다니는 여행"
    },
    {
      question: "사랑과 우정 중 하나만 선택해야 한다면?",
      optionA: "평생 깊은 사랑을 나눌 수 있지만 진정한 친구는 없는 삶",
      optionB: "평생 소중한 친구들과 함께하지만 진정한 사랑은 없는 삶"
    },
    {
      question: "연인의 핸드폰, 알림이 자주 울리는데 볼 수 있다면?",
      optionA: "안 보고 넘어간다 (신뢰가 우선)",
      optionB: "확인한다 (솔직함이 우선)"
    },
    {
      question: "데이트 중 연인의 친구를 만났을 때?",
      optionA: "적극적으로 대화에 참여하고 친해지려 노력한다",
      optionB: "예의만 갖추고 둘만의 시간을 빨리 가지려 한다"
    },
    {
      question: "연인이 변해버렸다면?",
      optionA: "과거의 모습을 그리워하며 되돌리려 노력한다",
      optionB: "변화를 받아들이고 새로운 모습을 사랑하려 노력한다"
    },
    {
      question: "이상형이지만 성격이 안맞는 사람 vs 이상형은 아니지만 성격이 잘맞는 사람?",
      optionA: "외모는 이상형이지만 성격이 안맞는 사람",
      optionB: "외모는 이상형이 아니지만 성격이 잘맞는 사람"
    },
    {
      question: "연인의 전 애인 사진을 발견했다면?",
      optionA: "묻지 않고 넘어간다",
      optionB: "왜 아직도 갖고 있는지 물어본다"
    },
    {
      question: "연인의 취향이 갑자기 바뀌었다면?",
      optionA: "새로운 취향을 이해하고 함께 즐기려 노력한다",
      optionB: "원래 취향으로 돌아오길 기다린다"
    },
    {
      question: "연인과의 여행, 많은 것을 보고 경험하는 바쁜 여행 vs 휴식 위주의 느긋한 여행?",
      optionA: "관광지를 많이 돌아다니며 경험을 쌓는 여행",
      optionB: "한 곳에서 여유롭게 쉬며 힐링하는 여행"
    },
    {
      question: "연인에게 선물을 받는다면?",
      optionA: "실용적이지만 감동적이지 않은 선물",
      optionB: "실용적이진 않지만 감동적인 선물"
    },
    {
      question: "연인의 취미 생활이 부담스럽다면?",
      optionA: "내가 적응하고 함께 즐기려 노력한다",
      optionB: "솔직하게 이야기하고 타협점을 찾는다"
    },
    {
      question: "소개팅에서 첫인상 vs 대화의 매력?",
      optionA: "첫인상은 평범하지만 대화가 잘 통하는 사람",
      optionB: "첫인상은 좋지만 대화가 어색한 사람"
    },
    {
      question: "연인과 2주간 연락이 안 된다면?",
      optionA: "매일 같은 시간에 5분만 통화",
      optionB: "중간에 한 번 하루종일 함께 있기"
    },
    {
      question: "결혼 후 살 집을 고른다면?",
      optionA: "교통과 편의시설이 좋은 작은 집",
      optionB: "교통은 불편하지만 넓고 쾌적한 집"
    },
    {
      question: "연인의 친구들과의 모임?",
      optionA: "자주 만나서 친해지기",
      optionB: "최소한으로 예의만 지키기"
    }
  ];

  // 이미 사용된 게임 필터링
  const { data: existingGames } = await supabase
    .from('balance_games')
    .select('question')
    .order('created_at', { ascending: false })
    .limit(15);

  const usedQuestions = new Set(existingGames?.map((g: { question: string }) => g.question) || []);
  const availableGames = balanceGames.filter(g => !usedQuestions.has(g.question));

  // 새로운 게임이 부족하면 배열에서 랜덤하게 선택
  let gamesToUse: typeof balanceGames = [];
  if (availableGames.length >= count) {
    // 충분한 새 게임이 있는 경우
    gamesToUse = availableGames.slice(0, count);
  } else {
    // 새 게임이 부족한 경우 중복 허용하여 선택
    gamesToUse = [...availableGames];
    const remainingCount = count - availableGames.length;
    
    for (let i = 0; i < remainingCount; i++) {
      const randomIndex = Math.floor(Math.random() * balanceGames.length);
      gamesToUse.push(balanceGames[randomIndex]);
    }
  }

  // 게임 생성 및 DB 저장
  const createdGames: any[] = [];
  for (const game of gamesToUse) {
    // 밸런스 게임 추가
    const { data: gameData, error: gameError } = await supabase
      .from('balance_games')
      .insert({
        question: game.question
      })
      .select();

    if (gameError || !gameData) {
      console.error('밸런스 게임 생성 오류:', gameError);
      continue;
    }

    const gameId = gameData[0].id;

    // 옵션 A 추가
    const { data: optionAData, error: optionAError } = await supabase
      .from('balance_game_options')
      .insert({
        game_id: gameId,
        content: game.optionA,
        is_option_a: true,
        votes_count: 0
      })
      .select();

    if (optionAError) {
      console.error('옵션 A 생성 오류:', optionAError);
      continue;
    }

    // 옵션 B 추가
    const { data: optionBData, error: optionBError } = await supabase
      .from('balance_game_options')
      .insert({
        game_id: gameId,
        content: game.optionB,
        is_option_a: false,
        votes_count: 0
      })
      .select();

    if (optionBError) {
      console.error('옵션 B 생성 오류:', optionBError);
      continue;
    }

    createdGames.push({
      ...gameData[0],
      option_a: optionAData[0],
      option_b: optionBData[0]
    });
  }

  return createdGames;
} 