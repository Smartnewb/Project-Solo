// 상단에 동적 렌더링 지시어 추가
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { matchUsersByGradeAndPreference } from '@/app/matchingAlgorithm';
import { Profile } from '@/app/types/matching';
import { UserPreferences } from '@/types';

// 필요한 인터페이스 정의
interface MatchResult {
  male: Profile;
  female: Profile;
  score: number;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  user1: any;
  user2: any;
  status: string;
  score: number;
  created_at: string;
  match_date: string;
  match_time: string;
}

// 필요한 데이터 타입 정의
interface VirtualUser {
  id: string;
  user_id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  department: string;
  instagram_id: string;
  mbti: string;
  classification: 'S' | 'A' | 'B' | 'C';
  interests: string[];
  personalities: string[];
  dating_styles: string[];
  height: number;
  smoking: string;
  drinking: string;
  tattoo: string;
  matchStatus: 'waiting' | 'matched';
  createdAt: string;
}

// 매칭 알고리즘 결과 타입
interface MatchAlgorithmResult {
  message: string;
  matches: Match[];
  matchDetails?: {
    match_id: string;
    score: number;
    user1: {
      name: string;
      age: number;
      gender: string;
      mbti: string;
      department: string;
    };
    user2: {
      name: string;
      age: number;
      gender: string;
      mbti: string;
      department: string;
    };
  }[];
}

// 매칭 알고리즘 옵션 타입
interface MatchingOptions {
  onlyGradeMatching?: boolean;
  ageGap?: number;
  includeInterests?: boolean;
  departmentMatch?: boolean;
  [key: string]: any; // 기타 옵션들
}

// 테스트 시나리오 결과 타입
interface TestScenarioResult extends MatchAlgorithmResult {
  scenario: string;
  userCount: number;
  options: MatchingOptions;
  stats: {
    totalUsers: number;
    matchedUsers: number;
    waitingUsers: number;
    matchingRate: string;
  };
}

// API 응답 타입
interface TestAPIResponse {
  timestamp: string;
  testResults: TestScenarioResult[];
}

// 로컬 데이터베이스 - 임시 메모리 객체 사용
interface LocalDB {
  profiles: VirtualUser[];
  matches: Match[];
  matchingRequests: any[];
}

const localDB: LocalDB = {
  profiles: [],
  matches: [],
  matchingRequests: []
};

// 가상 유저 생성 함수 인터페이스
interface VirtualUserProps {
  gender: 'male' | 'female';
  age: number;
  name: string;
  department: string;
  mbti: string;
  instagram_id?: string;
  classification?: 'S' | 'A' | 'B' | 'C';
}

// 가상 유저 생성 함수
function createVirtualUser(props: VirtualUserProps): VirtualUser {
  const { gender, age, name, department, mbti, instagram_id, classification } = props;
  const interests = ['영화', '음악', '독서', '여행', '요리', '스포츠', '게임'];
  const personalities = ['활발한', '차분한', '개방적인', '논리적인', '감성적인', '계획적인'];
  const dating_styles = ['낭만적인', '편안한', '자유로운', '열정적인', '활동적인'];
  const smokingOptions = ['비흡연', '가끔', '자주'];
  const drinkingOptions = ['안 마심', '가끔', '자주'];
  const tattooOptions = ['없음', '작은 문신', '큰 문신'];
  const heightOptions = [165, 170, 175, 180, 185];
  const id = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const randomInterests = interests.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1);
  const randomPersonalities = personalities.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
  const randomDatingStyles = dating_styles.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
  const gradeOptions: ('S' | 'A' | 'B' | 'C')[] = ['S', 'A', 'B', 'C'];
  
  const user: VirtualUser = {
    id,
    user_id: id,
    name: name || `${gender === 'male' ? '남' : '여'}${Math.floor(Math.random() * 100)}`,
    gender,
    age: age || (gender === 'male' ? 20 + Math.floor(Math.random() * 8) : 19 + Math.floor(Math.random() * 6)),
    department: department || ['컴퓨터공학과', '경영학과', '화학과', '의학과', '법학과'][Math.floor(Math.random() * 5)],
    instagram_id: instagram_id || `insta_${Math.floor(Math.random() * 10000)}`,
    mbti: mbti || ['ENFJ', 'INFP', 'ISTJ', 'ESTP', 'ENTJ'][Math.floor(Math.random() * 5)],
    classification: classification || gradeOptions[Math.floor(Math.random() * gradeOptions.length)],
    interests: randomInterests,
    personalities: randomPersonalities,
    dating_styles: randomDatingStyles,
    height: heightOptions[Math.floor(Math.random() * heightOptions.length)],
    smoking: smokingOptions[Math.floor(Math.random() * smokingOptions.length)],
    drinking: drinkingOptions[Math.floor(Math.random() * drinkingOptions.length)],
    tattoo: tattooOptions[Math.floor(Math.random() * tattooOptions.length)],
    matchStatus: 'waiting',
    createdAt: new Date().toISOString()
  };
  
  localDB.profiles.push(user);
  return user;
}

// 매칭 알고리즘 - /app/matchingAlgorithm.ts에서 등급 기반 매칭 알고리즘 사용
function runMatchingAlgorithm(options: MatchingOptions = {}): MatchAlgorithmResult {
  // 매칭 대기 중인 사용자 가져오기
  const users = localDB.profiles.filter(user => user.matchStatus === 'waiting')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (!users || users.length < 2) {
    return { message: '매칭 가능한 사용자가 부족합니다.', matches: [] as Match[] };
  }

  // 사용자 프로필을 매칭 알고리즘에 맞는 형태로 변환
  const profiles: Profile[] = users.map(user => ({
    id: user.id,
    user_id: user.user_id,
    name: user.name,
    gender: user.gender === 'male' ? 'male' : 'female',
    age: user.age,
    department: user.department,
    mbti: user.mbti,
    classification: user.classification,
    interests: user.interests || [],
    personalities: user.personalities || [],
    dating_styles: user.dating_styles || [],
    height: user.height,
    smoking: user.smoking,
    drinking: user.drinking,
    tattoo: user.tattoo
  }));
  
  // 테스트 결과를 더 자세히 보기 위한 로깅 추가
  if (options.onlyGradeMatching) {
    console.log('순수 등급 기반 매칭 테스트 실행:');
    console.log(`- 총 ${profiles.length}명의 사용자 (남성: ${profiles.filter(p => p.gender === 'male').length}, 여성: ${profiles.filter(p => p.gender === 'female').length})`);
    console.log('- 사용자 등급 분포:', profiles.reduce((acc, p) => {
      acc[p.classification as string] = (acc[p.classification as string] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
  }

  // 사용자 선호도 생성 (테스트용 가상 데이터)
  const preferences: UserPreferences[] = profiles.map(profile => {
    return {
      id: `pref_${Math.random().toString(36).substring(2, 9)}`,
      user_id: profile.id as string,
      preferred_age_min: Math.max(18, profile.age ? profile.age - 3 : 18),
      preferred_age_max: profile.age ? profile.age + 3 : 30,
      preferred_age_type: "younger",
      preferred_height_min: profile.gender === 'female' ? '170' : '155',
      preferred_height_max: profile.gender === 'female' ? '190' : '175',
      preferred_mbti: ['ENFJ', 'INFP', 'ISTJ', 'ESTP', 'ENTJ'].filter(m => m !== profile.mbti),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  // 등급 기반 매칭 알고리즘 호출
  const matchResults: MatchResult[] = matchUsersByGradeAndPreference(profiles, preferences);
  
  // 매칭 결과 가공
  const matches: Match[] = matchResults.map(result => {
    const maleId = result.male.id as string;
    const femaleId = result.female.id as string;
    const match: Match = {
      id: `match_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      user1_id: maleId,
      user2_id: femaleId,
      user1: users.find(u => u.id === maleId),
      user2: users.find(u => u.id === femaleId),
      status: 'pending',
      score: result.score,
      created_at: new Date().toISOString(),
      match_date: new Date().toISOString().split('T')[0],
      match_time: new Date().toISOString().split('T')[1].slice(0, 5)
    };
    
    return match;
  });

  // 매칭 결과 저장
  if (matches.length > 0) {
    localDB.matches = [...localDB.matches, ...matches];

    // 매칭된 사용자 상태 업데이트
    const matchedUserIds = new Set<string>();
    matches.forEach(match => {
      matchedUserIds.add(match.user1_id);
      matchedUserIds.add(match.user2_id);
    });
    
    localDB.profiles = localDB.profiles.map(user => {
      if (matchedUserIds.has(user.id)) {
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
function runTestScenario(scenarioName: string, userCount: number, options: MatchingOptions): TestScenarioResult {
  console.log(`\n===== 테스트 시나리오: ${scenarioName} =====`);
  
  // 로컬 DB 초기화
  localDB.profiles = [];
  localDB.matches = [];
  
  // 가상 사용자 생성
  const maleCount = Math.floor(userCount / 2);
  const femaleCount = userCount - maleCount;
  
  // 등급 배정 (여성 기준 S:10%, A:20%, B:30%, C:40%)
  // 남성은 여성보다 더 높은 등급으로 배정
  const gradeDistributions = {
    female: { S: 0.1, A: 0.2, B: 0.3, C: 0.4 },
    male: { S: 0.15, A: 0.25, B: 0.3, C: 0.3 }
  };
  
  function getRandomGrade(gender: string): 'S' | 'A' | 'B' | 'C' {
    const distribution = gender === 'male' ? gradeDistributions.male : gradeDistributions.female;
    const rand = Math.random();
    if (rand < distribution.S) return 'S';
    if (rand < distribution.S + distribution.A) return 'A';
    if (rand < distribution.S + distribution.A + distribution.B) return 'B';
    return 'C';
  }
  
  // 남성 사용자 생성
  for (let i = 0; i < maleCount; i++) {
    createVirtualUser({
      gender: 'male',
      age: 20 + Math.floor(Math.random() * 8), // 20-27세
      name: `남${i+1}`, 
      department: ['컴퓨터공학과', '경영학과', '화학과', '의학과', '법학과'][Math.floor(Math.random() * 5)],
      mbti: ['ENFJ', 'INFP', 'ISTJ', 'ESTP', 'ENTJ'][Math.floor(Math.random() * 5)],
      classification: getRandomGrade('male'),
      instagram_id: "" // 빈 값 추가
    });
  }
  
  // 여성 사용자 생성
  for (let i = 0; i < femaleCount; i++) {
    createVirtualUser({
      gender: 'female',
      age: 19 + Math.floor(Math.random() * 6), // 19-24세
      name: `여${i+1}`,
      department: ['컴퓨터공학과', '경영학과', '화학과', '의학과', '법학과'][Math.floor(Math.random() * 5)],
      mbti: ['ENFJ', 'INFP', 'ISTJ', 'ESTP', 'ENTJ'][Math.floor(Math.random() * 5)],
      classification: getRandomGrade('female'),
      instagram_id: "" // 빈 값 추가
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
    
    const results: TestAPIResponse = {
      timestamp: new Date().toISOString(),
      testResults: []
    };
    
    // 시나리오에 따라 테스트 실행
    if (scenario === 'pure_algorithm' || scenario === 'all') {
      // 순수 matchingAlgorithm.ts 테스트 (등급 기반 매칭만)
      results.testResults.push(
        runTestScenario('순수 등급 기반 매칭 알고리즘', size, { onlyGradeMatching: true })
      );
    }
    
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
