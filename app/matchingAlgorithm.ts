import { Profile, UserPreferences } from '@/types';

interface MatchScore {
  user1Id: string;
  user2Id: string;
  score: number;
}

export function findBestMatch(
  user: Profile,
  userPreferences: UserPreferences,
  candidates: Profile[],
  candidatePreferences: UserPreferences[]
): Profile | null {
  const matchScores: MatchScore[] = [];

  // 각 후보자와의 매칭 점수 계산
  for (const candidate of candidates) {
    // 같은 성별이면 매칭하지 않음
    if (user.gender === candidate.gender) continue;

    const candidatePref = candidatePreferences.find(
      pref => pref.user_id === candidate.id
    );
    if (!candidatePref) continue;

    const score = calculateMatchScore(user, userPreferences, candidate, candidatePref);
    matchScores.push({
      user1Id: user.id,
      user2Id: candidate.id,
      score
    });
  }

  // 점수가 가장 높은 매칭 찾기
  const bestMatch = matchScores.reduce((best, current) => 
    current.score > best.score ? current : best
  , { user1Id: '', user2Id: '', score: -1 });

  if (bestMatch.score === -1) return null;

  return candidates.find(c => c.id === bestMatch.user2Id) || null;
}

function calculateMatchScore(
  user1: Profile,
  user1Preferences: UserPreferences,
  user2: Profile,
  user2Preferences: UserPreferences
): number {
  let score = 0;

  // 나이 선호도 체크 (10점)
  if (user2.age && user1.age) {
    // 기본 나이 범위 체크
    if (
      user2.age >= user1Preferences.preferred_age_min &&
      user2.age <= user1Preferences.preferred_age_max
    ) {
      score += 10;
    }
  }

  // 키 선호도 체크 (20점)
  const height2 = typeof user2.height === 'string' ? parseInt(user2.height) : user2.height;
  const prefHeightMin = parseInt(user1Preferences.preferred_height_min);
  const prefHeightMax = parseInt(user1Preferences.preferred_height_max);
  if (height2 >= prefHeightMin && height2 <= prefHeightMax) {
    score += 20;
  }

  // MBTI 선호도 체크 (20점)
  if (user1Preferences.preferred_mbti.includes(user2.mbti)) {
    score += 20;
  }

  // 관심사 매칭 (각 5점)
  if (user1.interests && user2.interests) {
    const commonInterests = user1.interests.filter(interest => 
      user2.interests?.includes(interest)
    );
    score += commonInterests.length * 5;
  }

  // 생활 스타일 매칭 (각 5점)
  if (user1.lifestyles && user2.lifestyles) {
    const commonLifestyles = user1.lifestyles.filter(style => 
      user2.lifestyles?.includes(style)
    );
    score += commonLifestyles.length * 5;
  }

  // 데이트 스타일 매칭 (각 5점)
  if (user1.datingStyles && user2.datingStyles) {
    const commonDatingStyles = user1.datingStyles.filter(style => 
      user2.datingStyles?.includes(style)
    );
    score += commonDatingStyles.length * 5;
  }

  // 성격 매칭 (각 5점)
  if (user1.personalities && user2.personalities) {
    const commonPersonalities = user1.personalities.filter(personality => 
      user2.personalities?.includes(personality)
    );
    score += commonPersonalities.length * 5;
  }

  // 음주, 흡연, 타투 선호도 매칭 (각 10점)
  if (user1.drinking === user2.drinking) score += 10;
  if (user1.smoking === user2.smoking) score += 10;
  if (user1.tattoo === user2.tattoo) score += 10;

  return score;
} 