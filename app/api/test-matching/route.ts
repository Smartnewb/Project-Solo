import { NextResponse } from 'next/server';

// 로컬 데이터베이스 - 임시 메모리 객체 사용
const localDB = {
  profiles: [],
  matches: [],
  matchingRequests: []
};

// 가상 유저 생성 함수
function createVirtualUser({ gender, age, name, department, mbti, instagram_id, classification }) {
  const id = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const user = {
    id,
    user_id: id,
    name: name || `${gender === 'male' ? '남' : '여'}${Math.floor(Math.random() * 100)}`,
    gender,
    age: age || (gender === 'male' ? 20 + Math.floor(Math.random() * 8) : 19 + Math.floor(Math.random() * 6)),
    department: department || ['컴퓨터공학과', '경영학과', '화학과', '의학과', '법학과'][Math.floor(Math.random() * 5)],
    instagram_id: instagram_id || `insta_${Math.floor(Math.random() * 10000)}`,
    mbti: mbti || ['ENFJ', 'INFP', 'ISTJ', 'ESTP', 'ENTJ'][Math.floor(Math.random() * 5)],
    classification: classification || ['학부생', '대학원생'][Math.floor(Math.random() * 2)],
    matchStatus: 'waiting',
    createdAt: new Date().toISOString()
  };
  
  localDB.profiles.push(user);
  return user;
}

// 매칭 알고리즘 - /app/api/matching/route.ts 기반으로 재구현
function runMatchingAlgorithm(options = {}) {
  const {
    ageGap = 3,        // 기본 나이 차이 제한
    includeInterests = false,  // MBTI 고려 여부
    departmentMatch = false    // 학과 고려 여부
  } = options;

  // 매칭 대기 중인 사용자 가져오기
  const users = localDB.profiles.filter(user => user.matchStatus === 'waiting')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (!users || users.length < 2) {
    return { message: '매칭 가능한 사용자가 부족합니다.', matches: [] };
  }

  // 매칭 알고리즘
  const matches = [];
  const matched = new Set();

  // 남성과 여성 사용자 분리
  const maleUsers = users.filter(user => user.gender === 'male');
  const femaleUsers = users.filter(user => user.gender === 'female');
  
  // 매칭 점수 계산 함수 - 두 사용자 간의 호환성 점수를 계산
  function calculateMatchScore(user1, user2) {
    let score = 100; // 기본 점수
    
    // 나이 차이에 따른 감점
    const ageDiff = Math.abs(user1.age - user2.age);
    if (ageDiff > ageGap) {
      return -1; // 매칭 불가능
    }
    score -= ageDiff * 5; // 나이 차이당 5점 감점
    
    // MBTI 호환성
    if (includeInterests) {
      const compatiblePairs = {
        'ENFJ': ['INFP', 'ISFP', 'ENFP'],
        'INFP': ['ENFJ', 'ENTJ', 'INFJ'],
        'ISTJ': ['ESFP', 'ESTP', 'ISFJ'],
        'ESTP': ['ISTJ', 'ISFJ', 'ESTJ'],
        'ENTJ': ['INFP', 'INTP', 'ENFP']
      };
      
      const mbtiCompatible = compatiblePairs[user1.mbti]?.includes(user2.mbti) || 
                           compatiblePairs[user2.mbti]?.includes(user1.mbti);
      
      if (!mbtiCompatible) {
        score -= 30; // MBTI 비호환성 감점
      }
    }
    
    // 학과 다양성
    if (departmentMatch && user1.department === user2.department) {
      score -= 20; // 같은 학과 감점
    }
    
    return score;
  }
  
  // 최적 매칭 알고리즘 (헝가리안 알고리즘 간소화 버전)
  const matchPairs = [];
  
  // 각 남성 사용자에 대해 모든 여성 사용자와의 매칭 점수 계산
  for (const maleUser of maleUsers) {
    if (matched.has(maleUser.id)) continue;
    
    let bestScore = -1;
    let bestMatch = null;
    
    for (const femaleUser of femaleUsers) {
      if (matched.has(femaleUser.id)) continue;
      
      const score = calculateMatchScore(maleUser, femaleUser);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = femaleUser;
      }
    }
    
    // 매칭 가능한 상대를 찾았으면 추가
    if (bestMatch && bestScore > 0) {
      matchPairs.push({
        maleUser,
        femaleUser: bestMatch,
        score: bestScore
      });
      matched.add(maleUser.id);
      matched.add(bestMatch.id);
    }
  }
  
  // 점수가 높은 순으로 정렬
  matchPairs.sort((a, b) => b.score - a.score);
  
  // 매칭 결과 생성
  for (const pair of matchPairs) {
    const match = {
      id: `match_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      user1_id: pair.maleUser.id,
      user2_id: pair.femaleUser.id,
      user1: pair.maleUser,  // 매칭 정보에 유저 객체 직접 포함 (테스트용)
      user2: pair.femaleUser,  // 매칭 정보에 유저 객체 직접 포함 (테스트용)
      status: 'pending',
      score: pair.score,
      created_at: new Date().toISOString(),
      match_date: new Date().toISOString().split('T')[0],
      match_time: new Date().toISOString().split('T')[1].slice(0, 5)
    };
    
    matches.push(match);
  }

  // 매칭 결과 저장
  if (matches.length > 0) {
    localDB.matches = [...localDB.matches, ...matches];

    // 매칭된 사용자 상태 업데이트
    const matchedUsers = Array.from(matched);
    localDB.profiles = localDB.profiles.map(user => {
      if (matchedUsers.includes(user.id)) {
        return { ...user, matchStatus: 'matched' };
      }
      return user;
    });
  }

  return {
    message: `${matches.length}쌍의 매칭이 완료되었습니다.`,
    matches,
    matchDetails: matches.map(m => ({
      match_id: m.id,
      score: m.score,
      user1: { name: m.user1.name, age: m.user1.age, gender: m.user1.gender, mbti: m.user1.mbti, department: m.user1.department },
      user2: { name: m.user2.name, age: m.user2.age, gender: m.user2.gender, mbti: m.user2.mbti, department: m.user2.department }
    }))
  };
}

// 테스트 시나리오 실행
function runTestScenario(scenarioName, userCount, options) {
  console.log(`\n===== 테스트 시나리오: ${scenarioName} =====`);
  
  // 로컬 DB 초기화
  localDB.profiles = [];
  localDB.matches = [];
  
  // 가상 사용자 생성
  const maleCount = Math.floor(userCount / 2);
  const femaleCount = userCount - maleCount;
  
  // 남성 사용자 생성
  for (let i = 0; i < maleCount; i++) {
    createVirtualUser({
      gender: 'male',
      age: 20 + Math.floor(Math.random() * 8), // 20-27세
      name: `남${i+1}`, 
      department: ['컴퓨터공학과', '경영학과', '화학과', '의학과', '법학과'][Math.floor(Math.random() * 5)],
      mbti: ['ENFJ', 'INFP', 'ISTJ', 'ESTP', 'ENTJ'][Math.floor(Math.random() * 5)]
    });
  }
  
  // 여성 사용자 생성
  for (let i = 0; i < femaleCount; i++) {
    createVirtualUser({
      gender: 'female',
      age: 19 + Math.floor(Math.random() * 6), // 19-24세
      name: `여${i+1}`,
      department: ['컴퓨터공학과', '경영학과', '화학과', '의학과', '법학과'][Math.floor(Math.random() * 5)],
      mbti: ['ENFJ', 'INFP', 'ISTJ', 'ESTP', 'ENTJ'][Math.floor(Math.random() * 5)]
    });
  }
  
  // 매칭 알고리즘 실행
  const matchResult = runMatchingAlgorithm(options);
  
  // 기본 통계
  const stats = {
    totalUsers: localDB.profiles.length,
    matchedUsers: localDB.profiles.filter(u => u.matchStatus === 'matched').length,
    waitingUsers: localDB.profiles.filter(u => u.matchStatus === 'waiting').length,
    matchingRate: (matchResult.matches.length * 2 / userCount * 100).toFixed(2) + '%'
  };
  
  return {
    scenario: scenarioName,
    userCount,
    options,
    ...matchResult,
    stats
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'all';
    const size = parseInt(searchParams.get('size') || '20');
    
    const results = {
      timestamp: new Date().toISOString(),
      testResults: []
    };
    
    // 시나리오에 따라 테스트 실행
    if (scenario === 'basic' || scenario === 'all') {
      // 기본 매칭 알고리즘 (나이 차이 3살 이내)
      results.testResults.push(
        runTestScenario('기본 매칭 알고리즘', size, { ageGap: 3 })
      );
    }
    
    if (scenario === 'mbti' || scenario === 'all') {
      // MBTI 호환성 고려 매칭
      results.testResults.push(
        runTestScenario('MBTI 호환성 고려 매칭', size, { ageGap: 3, includeInterests: true })
      );
    }
    
    if (scenario === 'department' || scenario === 'all') {
      // 학과 다양성 고려 매칭
      results.testResults.push(
        runTestScenario('학과 다양성 고려 매칭', size, { ageGap: 3, departmentMatch: true })
      );
    }
    
    if (scenario === 'combined' || scenario === 'all') {
      // 종합 알고리즘 (나이, MBTI, 학과 모두 고려)
      results.testResults.push(
        runTestScenario('종합 매칭 알고리즘', size, { ageGap: 3, includeInterests: true, departmentMatch: true })
      );
    }
    
    if (scenario === 'large' || scenario === 'all') {
      // 대규모 테스트
      results.testResults.push(
        runTestScenario('대규모 매칭 테스트', 100, { ageGap: 3, includeInterests: true, departmentMatch: true })
      );
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: '테스트 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
