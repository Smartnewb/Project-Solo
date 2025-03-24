import { UserPreferences } from '@/types';
import { Profile } from '@/app/types/matching';

// 정의된 등급 타입
type Grade = 'S' | 'A' | 'B' | 'C';

// 매칭 결과 인터페이스
interface MatchResult {
  female: Profile;
  male: Profile;
  score: number;
}

// 매칭 점수 인터페이스
interface MatchScore {
  user1Id: string;
  user2Id: string;
  score: number;
}

/**
 * 등급 우선 매칭 알고리즘을 사용하여 전체 사용자를 매칭
 * @param users 모든 사용자 프로필 목록
 * @param preferences 모든 사용자 선호도 목록
 * @returns 매칭 결과 리스트
 */
export function matchUsersByGradeAndPreference(
  users: Profile[],
  preferences: UserPreferences[]
): MatchResult[] {
  // 성별에 따라 사용자 분류
  const females = users.filter(user => user.gender === 'female' && user.id !== undefined);
  const males = users.filter(user => user.gender === 'male' && user.id !== undefined);
  
  // 매칭 결과 저장 배열
  const matchResults: MatchResult[] = [];
  
  // 매칭된 사용자 ID 추적
  const matchedUserIds = new Set<string>();
  
  // 등급별 처리 (여성 기준 S → A → B → C 순서)
  const grades: Grade[] = ['S', 'A', 'B', 'C'];
  
  for (const femaleGrade of grades) {
    // 현재 등급의 여성들
    const femalesInGrade = females.filter(
      f => f.id !== undefined && !matchedUserIds.has(f.id as string) && f.classification === femaleGrade
    );
    
    // 현재 등급의 여성들 매칭
    for (const female of femalesInGrade) {
      if (!female.id) continue; // ID가 없으면 건너뛰기
      const femalePref = preferences.find(p => p.user_id === female.id);
      if (!femalePref) continue; // 선호도 정보가 없으면 건너뛰기
      
      // 매칭 가능한 남성 필터링
      const eligibleMales = males.filter(male => {
        // ID가 없거나 이미 매칭된 사용자 제외
        if (!male.id || matchedUserIds.has(male.id)) return false;
        
        const malePref = preferences.find(p => p.user_id === male.id);
        if (!malePref) return false; // 선호도 정보가 없으면 제외
        
        // 하드 필터 적용
        return isEligibleForMatching(female, male, femalePref, malePref);
      });
      
      if (eligibleMales.length === 0) continue; // 매칭 가능한 남성이 없으면 다음 여성으로
      
      // 남성 후보들의 점수 계산
      const candidateScores = eligibleMales.map(male => {
        const malePref = preferences.find(p => p.user_id === male.id)!;
        const score = calculateMatchScore(female, femalePref, male, malePref);
        return { user1Id: female.id as string, user2Id: male.id as string, score };
      });
      
      // 점수가 가장 높은 남성 선택
      const bestMatch = candidateScores.reduce(
        (best, current) => current.score > best.score ? current : best,
        { user1Id: '', user2Id: '', score: -1 }
      );
      
      if (bestMatch.score === -1) continue; // 유효한 매칭이 없으면 다음 여성으로
      
      // 매칭된 남성 찾기
      const matchedMale = males.find(m => m.id === bestMatch.user2Id)!;
      
      // 매칭 결과 저장
      matchResults.push({
        female,
        male: matchedMale,
        score: bestMatch.score
      });
      
      // 매칭된 사용자 ID 기록
      if (female.id && matchedMale.id) {
        matchedUserIds.add(female.id);
        matchedUserIds.add(matchedMale.id);
      }
    }
  }
  
  return matchResults;
}

/**
 * 하드 필터 조건에 따라 매칭 가능 여부 결정
 */
function isEligibleForMatching(
  female: Profile,
  male: Profile,
  femalePref: UserPreferences,
  malePref: UserPreferences
): boolean {
  // 1. 성별 조건 (이미 필터링됨, 확인용)
  if (female.gender === male.gender) return false;
  
  // 2. MBTI 필터: 동일 MBTI 제외
  if (female.mbti === male.mbti) return false;
  
  // 3. 학과 필터: 동일 학과 제외
  if (female.department === male.department) return false;
  
  // 4. 등급 필터: 여성이 하위등급, 남성이 상위등급인 경우만 허용
  const gradeValues: Record<Grade, number> = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
  const femaleGradeVal = female.classification ? (gradeValues[female.classification as Grade] || 0) : 0;
  const maleGradeVal = male.classification ? (gradeValues[male.classification as Grade] || 0) : 0;
  
  // 같은 등급이거나 (여성 하위 등급 - 남성 상위 등급) 조합만 허용
  if (!(femaleGradeVal === maleGradeVal || (femaleGradeVal < maleGradeVal))) {
    return false;
  }
  
  // 5. 흡연 필터: 비흡연자는 비흡연자와만 매칭
  if (female.smoking && male.smoking) {
    if (female.smoking === '비흡연' && male.smoking !== '비흡연') return false;
    if (male.smoking === '비흡연' && female.smoking !== '비흡연') return false;
  }
  
  // 6. 음주 필터: 음주 안 하는 사람은 금주자와만 매칭
  if (female.drinking && male.drinking) {
    if (female.drinking === '안 마심' && male.drinking !== '안 마심') return false;
    if (male.drinking === '안 마심' && female.drinking !== '안 마심') return false;
  }
  
  // 7. 타투 필터: 타투 없는 사람은 타투 없는 사람과만 매칭
  if (female.tattoo && male.tattoo) {
    if (female.tattoo === '없음' && male.tattoo !== '없음') return false;
    if (male.tattoo === '없음' && female.tattoo !== '없음') return false;
  }
  
  return true; // 모든 하드 필터 조건 통과
}

/**
 * 매칭 점수 계산 함수
 * @returns 계산된 매칭 점수
 */
function calculateMatchScore(
  female: Profile,
  femalePref: UserPreferences,
  male: Profile,
  malePref: UserPreferences
): number {
  let score = 0;
  
  // 1. 나이 선호도 일치 (10점)
  if (
    male.age !== undefined && female.age !== undefined &&
    male.age >= femalePref.preferred_age_min &&
    male.age <= femalePref.preferred_age_max &&
    female.age >= malePref.preferred_age_min &&
    female.age <= malePref.preferred_age_max
  ) {
    score += 10;
  }
  
  // 2. 키 선호도 일치 (10점)
  if (male.height !== undefined && female.height !== undefined) {
    const maleHeight = typeof male.height === 'string' ? parseInt(male.height as string) : male.height;
    const femaleHeight = typeof female.height === 'string' ? parseInt(female.height as string) : female.height;
    const femalePrefHeightMin = parseInt(femalePref.preferred_height_min || '0');
    const femalePrefHeightMax = parseInt(femalePref.preferred_height_max || '200');
    const malePrefHeightMin = parseInt(malePref.preferred_height_min || '0');
    const malePrefHeightMax = parseInt(malePref.preferred_height_max || '200');
    
    if (
      maleHeight !== undefined && femaleHeight !== undefined &&
      maleHeight >= femalePrefHeightMin &&
      maleHeight <= femalePrefHeightMax &&
      femaleHeight >= malePrefHeightMin &&
      femaleHeight <= malePrefHeightMax
    ) {
      score += 10;
    }
  }
  
  // 3. MBTI 선호도 포함 (10점)
  if (
    male.mbti && female.mbti &&
    femalePref.preferred_mbti?.includes(male.mbti) &&
    malePref.preferred_mbti?.includes(female.mbti)
  ) {
    score += 10;
  }
  
  // 4. 관심사 매칭 (1개당 2점)
  if (female.interests && male.interests) {
    const commonInterests = female.interests.filter((interest: string) => 
      male.interests?.includes(interest)
    );
    score += commonInterests.length * 2;
  }
  
  // 5. 성격 매칭 (1개당 3점)
  if (female.personalities && male.personalities) {
    const commonPersonalities = female.personalities.filter((personality: string) => 
      male.personalities?.includes(personality)
    );
    score += commonPersonalities.length * 3;
  }
  
  // 6. 데이트 스타일 매칭 (1개당 3점)
  if (female.dating_styles && male.dating_styles) {
    const commonDatingStyles = female.dating_styles.filter((style: string) => 
      male.dating_styles?.includes(style)
    );
    score += commonDatingStyles.length * 3;
  }
  
  // 7. 생활 스타일 매칭 (각 3점)
  if (female.drinking === male.drinking) score += 3;
  if (female.smoking === male.smoking) score += 3;
  if (female.tattoo === male.tattoo) score += 3;
  
  return score;
}

/**
 * 기존의 findBestMatch 함수는 백워드 호환성을 위해 유지
 * 하지만 내부적으로는 새로운 매칭 로직 사용
 */
export function findBestMatch(
  user: Profile,
  userPreferences: UserPreferences,
  candidates: Profile[],
  candidatePreferences: UserPreferences[]
): Profile | null {
  // 모든 사용자 중 현재 사용자를 제외하고 1:1 매칭 시뮬레이션
  const allUsers = [user, ...candidates];
  const allPreferences = [
    userPreferences, 
    ...candidatePreferences.filter(p => p.user_id !== userPreferences.user_id)
  ];
  
  // 현재 사용자가 여성인 경우
  if (user.gender === 'female') {
    const results = matchUsersByGradeAndPreference(allUsers, allPreferences);
    const match = results.find(result => result.female.id === user.id);
    return match ? match.male : null;
  }
  // 현재 사용자가 남성인 경우
  else {
    const results = matchUsersByGradeAndPreference(allUsers, allPreferences);
    const match = results.find(result => result.male.id === user.id);
    return match ? match.female : null;
  }
} 