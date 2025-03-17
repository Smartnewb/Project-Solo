import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UserProfile {
  user_id: string;
  name: string;
  age: number;
  gender: string;
  classification: string;
  mbti: string;
  smoking: string;
  drinking: string;
  tattoo: string;
  height: string;
  personalities: string[];
  datingStyles: string[];
  interests: string[];
  department: string;
}

async function fetchProfiles() {
  const supabase = createClientComponentClient();
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return profiles;
}

function calculateScore(female: UserProfile, male: UserProfile): number {
  let score = 0;

  // 1. 같은 학과 제외
  if (female.department === male.department) return -1;

  // 2. S/A/B/C 그룹 매칭
  if (female.classification === male.classification) {
    score += 10;
  } else if (female.classification.charCodeAt(0) + 1 === male.classification.charCodeAt(0)) {
    score += 5;
  }

  // 3. MBTI 필터링
  if (female.mbti === male.mbti) {
    score += 5;
  }

  // 4. 라이프스타일 필터링
  if (female.smoking === male.smoking) score += 3;
  if (female.drinking === male.drinking) score += 3;
  if (female.tattoo === male.tattoo) score += 3;

  // 5. 키 매칭
  if (female.height === male.height) score += 2;

  // 6. 성격 매칭
  const commonPersonalities = female.personalities.filter(p => male.personalities.includes(p));
  score += commonPersonalities.length * 2;

  // 7. 데이트 스타일 매칭
  const commonDatingStyles = female.datingStyles.filter(d => male.datingStyles.includes(d));
  score += commonDatingStyles.length * 2;

  // 8. 관심사 매칭
  const commonInterests = female.interests.filter(i => male.interests.includes(i));
  score += commonInterests.length;

  return score;
}

export async function findBestMatch(femaleProfile: UserProfile) {
  const profiles = await fetchProfiles();
  const maleProfiles = profiles.filter((p: UserProfile) => p.gender === 'male');

  let bestMatch = null;
  let highestScore = -1;

  for (const male of maleProfiles) {
    const score = calculateScore(femaleProfile, male);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = male;
    }
  }

  return bestMatch;
} 