/**
 * 매칭 알고리즘 테스트 스크립트
 * 로컬 DB에서 가상 유저를 생성해 매칭 알고리즘을 테스트합니다.
 */

// 로컬 데이터베이스 - 임시 메모리 객체 사용
const localDB = {
  profiles: [],
  matches: []
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

  for (let i = 0; i < users.length; i++) {
    if (matched.has(users[i].id)) continue;

    for (let j = i + 1; j < users.length; j++) {
      if (matched.has(users[j].id)) continue;

      // 기본 매칭 조건
      let isMatch = 
        users[i].gender !== users[j].gender && // 다른 성별
        Math.abs(users[i].age - users[j].age) <= ageGap; // 나이 차이 제한

      // 확장된 매칭 조건
      if (isMatch && includeInterests) {
        // MBTI 호환성 검사 (추가 로직)
        const compatiblePairs = {
          'ENFJ': ['INFP', 'ISFP', 'ENFP'],
          'INFP': ['ENFJ', 'ENTJ', 'INFJ'],
          'ISTJ': ['ESFP', 'ESTP', 'ISFJ'],
          'ESTP': ['ISTJ', 'ISFJ', 'ESTJ'],
          'ENTJ': ['INFP', 'INTP', 'ENFP']
        };
        
        // 상대방의 MBTI가 호환되는 경우 매칭 점수 가산
        const mbtiCompatible = compatiblePairs[users[i].mbti]?.includes(users[j].mbti) || 
                             compatiblePairs[users[j].mbti]?.includes(users[i].mbti);
        
        if (!mbtiCompatible) {
          isMatch = false; // MBTI가 호환되지 않으면 매칭하지 않음
        }
      }

      // 학과 고려
      if (isMatch && departmentMatch) {
        if (users[i].department === users[j].department) {
          isMatch = false; // 같은 학과면 매칭하지 않음 (다양성을 위해)
        }
      }

      if (isMatch) {
        const match = {
          id: `match_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          user1_id: users[i].id,
          user2_id: users[j].id,
          user1: users[i],  // 매칭 정보에 유저 객체 직접 포함 (테스트용)
          user2: users[j],  // 매칭 정보에 유저 객체 직접 포함 (테스트용)
          status: 'pending',
          created_at: new Date().toISOString(),
          match_date: new Date().toISOString().split('T')[0],
          match_time: new Date().toISOString().split('T')[1].slice(0, 5)
        };

        matches.push(match);
        matched.add(users[i].id);
        matched.add(users[j].id);
        break;
      }
    }
  }

  // 매칭 결과 저장
  if (matches.length > 0) {
    localDB.matches.push(...matches);

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
  
  console.log(`\n가상 사용자 생성: 남자 ${maleCount}명, 여자 ${femaleCount}명`);
  
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
  
  // 사용자 목록 출력
  console.log('\n생성된 가상 사용자 목록:');
  localDB.profiles.forEach(user => {
    console.log(`${user.name} (${user.gender}, ${user.age}세, ${user.department}, ${user.mbti})`);
  });
  
  // 매칭 알고리즘 실행
  const matchResult = runMatchingAlgorithm(options);
  
  // 결과 출력
  console.log(`\n매칭 결과: ${matchResult.message}`);
  
  if (matchResult.matchDetails && matchResult.matchDetails.length > 0) {
    console.log('\n매칭 상세:');
    matchResult.matchDetails.forEach((match, index) => {
      console.log(`\n매칭 #${index+1}:`);
      console.log(`- ${match.user1.name} (${match.user1.gender}, ${match.user1.age}세, ${match.user1.department}, ${match.user1.mbti})`);
      console.log(`- ${match.user2.name} (${match.user2.gender}, ${match.user2.age}세, ${match.user2.department}, ${match.user2.mbti})`);
      console.log(`- 나이 차이: ${Math.abs(match.user1.age - match.user2.age)}세`);
    });
  } else {
    console.log('매칭된 사용자가 없습니다.');
  }
  
  // 통계
  console.log('\n매칭 통계:');
  console.log(`- 전체 사용자: ${localDB.profiles.length}명`);
  console.log(`- 매칭된 사용자: ${Array.from(localDB.profiles.filter(u => u.matchStatus === 'matched')).length}명`);
  console.log(`- 대기 중인 사용자: ${Array.from(localDB.profiles.filter(u => u.matchStatus === 'waiting')).length}명`);
  console.log(`- 매칭 성공률: ${(matchResult.matches.length * 2 / userCount * 100).toFixed(2)}%`);
  
  return matchResult;
}

// 테스트 시나리오 실행
console.log('====== 매칭 알고리즘 테스트 시작 ======');

// 기본 시나리오: 기본 매칭 알고리즘 (나이 차이 3살 이내)
runTestScenario('기본 매칭 알고리즘', 20, { ageGap: 3 });

// 시나리오 2: 확장된 매칭 알고리즘 (MBTI 고려)
runTestScenario('MBTI 호환성 고려 매칭', 20, { ageGap: 3, includeInterests: true });

// 시나리오 3: 학과 다양성 고려 매칭 (같은 학과 매칭 제외)
runTestScenario('학과 다양성 고려 매칭', 20, { ageGap: 3, departmentMatch: true });

// 시나리오 4: 종합 알고리즘 (나이, MBTI, 학과 모두 고려)
runTestScenario('종합 매칭 알고리즘', 20, { ageGap: 3, includeInterests: true, departmentMatch: true });

// 시나리오 5: 대규모 테스트 (100명의 사용자)
runTestScenario('대규모 매칭 테스트', 100, { ageGap: 3, includeInterests: true, departmentMatch: true });

console.log('\n====== 매칭 알고리즘 테스트 완료 ======');
