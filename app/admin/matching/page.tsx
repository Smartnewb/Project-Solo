'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';
import { createClient } from '@/utils/supabase/client';

// 매칭된 유저 타입 정의
interface MatchedUser {
  id: string;
  name: string;
  classification: string;
  gender: string;
  age: number;
  department: string;
  instagram_id: string;
  mbti: string;
}

// 매칭 타입 정의
interface MatchData {
  id: string;
  status: string;
  created_at: string;
  match_date: string;
  user1: MatchedUser; // 남성
  user2: MatchedUser; // 여성
}

// 매칭 알고리즘에 필요한 인터페이스 추가
interface Profile {
  id: string;
  user_id: string;
  name: string;
  gender: string;
  age: number;
  department: string;
  mbti: string;
  height: number;
  personalities: string[];
  dating_styles: string[];
  smoking: boolean;
  drinking: boolean;
  tattoo: boolean;
  classification?: string;
}

interface UserPreference {
  user_id: string;
  preferred_age_type: string;
  preferred_height_min: number;
  preferred_height_max: number;
  preferred_mbti: string[];
  disliked_mbti: string[];
  preferred_personalities: string[];
  preferred_dating_styles: string[];
  preferred_smoking: boolean;
  preferred_drinking: boolean;
  preferred_tattoo: boolean;
}

// 등급별 점수 가중치 추가
const gradeValues: Record<string, number> = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };

export default function AdminMatching() {
  const [matchingDate, setMatchingDate] = useState('');
  const [savedMatchingTime, setSavedMatchingTime] = useState<string | null>(null);
  const [isSignupEnabled, setIsSignupEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [isMatchListLoading, setIsMatchListLoading] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<MatchData[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; content: string }>({
    type: 'info',
    content: ''
  });
  const [matchResults, setMatchResults] = useState<Array<{
    female: Profile & { preferences: UserPreference };
    male: Profile;
    score: number;
    details: any;
  }>>([]);

  useEffect(() => {
    fetchMatchingTime();
    fetchSignupStatus();
    fetchMatchedUsers();
  }, []);

  const fetchMatchingTime = async () => {
    try {
      setIsLoading(true);
      console.log('매칭 시간 조회 시작');
      
      const response = await fetch('/api/admin/matching-time');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('매칭 시간 데이터:', data);
      
      // matchingTime 또는 matchingDateTime이 있는 경우 처리
      const matchingTimeValue = data.matchingTime || data.matchingDateTime;
      
      if (matchingTimeValue) {
        // ISO 날짜 문자열을 로컬 시간으로 변환하여 datetime-local 입력창에 표시
        const date = new Date(matchingTimeValue);
        // YYYY-MM-DDThh:mm 형식으로 변환 (datetime-local 입력창 형식)
        const localDateTimeString = date.toISOString().slice(0, 16);
        console.log('설정할 매칭 시간:', localDateTimeString);
        setMatchingDate(localDateTimeString);
        setSavedMatchingTime(matchingTimeValue);
        setMessage({
          type: 'info',
          content: `현재 설정된 매칭 시간을 불러왔습니다. (${date.toLocaleString('ko-KR')})`
        });
      } else {
        console.log('설정된 매칭 시간 없음');
        setMatchingDate('');
        setSavedMatchingTime(null);
        setMessage({
          type: 'info',
          content: '설정된 매칭 시간이 없습니다.'
        });
      }
    } catch (error) {
      console.error('매칭 시간 조회 실패:', error);
      setMessage({ 
        type: 'error', 
        content: '매칭 시간 조회에 실패했습니다. 다시 시도해 주세요.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSignupStatus = async () => {
    try {
      console.log('회원가입 상태 정보 가져오기 시작');
      const response = await fetch('/api/admin/signup-control');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('회원가입 상태 정보:', data);
      
      if (data.isSignupEnabled !== undefined) {
        setIsSignupEnabled(data.isSignupEnabled);
        setMessage({
          type: 'info',
          content: `현재 회원가입이 ${data.isSignupEnabled ? '활성화' : '비활성화'} 상태입니다.`
        });
      } else {
        setMessage({
          type: 'error',
          content: '회원가입 상태 정보를 불러올 수 없습니다.'
        });
      }
    } catch (error) {
      console.error('회원가입 상태 조회 실패:', error);
      setMessage({ 
        type: 'error', 
        content: '회원가입 상태 조회에 실패했습니다.' 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      console.log('매칭 시간 설정 요청:', matchingDate);
      
      const response = await fetch('/api/admin/matching-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchingTime: matchingDate }),
      });

      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('매칭 시간 설정 응답:', data);

      // 설정된 매칭 시간을 상태에 저장
      if (data.success) {
        const matchingTimeValue = data.matchingTime || data.matchingDateTime;
        if (matchingTimeValue) {
          console.log('새로운 매칭 시간 설정됨:', matchingTimeValue);
          setSavedMatchingTime(matchingTimeValue);
          setMessage({
            type: 'success',
            content: '매칭 시간이 성공적으로 설정되었습니다.'
          });
        }
      }

      // 매칭 시간 설정 후 자동으로 새로고침
      await fetchMatchingTime();
    } catch (error) {
      console.error('매칭 시간 설정 실패:', error);
      setMessage({
        type: 'error',
        content: '매칭 시간 설정에 실패했습니다. 다시 시도해 주세요.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSignup = async () => {
    try {
      setIsLoading(true);
      console.log(`회원가입 상태 변경 요청: ${isSignupEnabled ? '비활성화' : '활성화'}`);
      
      const response = await fetch('/api/admin/signup-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSignupEnabled: !isSignupEnabled }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('회원가입 상태 변경 응답:', data);

      if (data.success) {
        setIsSignupEnabled(!isSignupEnabled);
        setMessage({
          type: 'success',
          content: `회원가입이 ${!isSignupEnabled ? '활성화' : '비활성화'}되었습니다.`
        });
      } else {
        throw new Error('회원가입 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 상태 변경 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '회원가입 상태 변경에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMatchScore = (female: Profile, male: Profile, femalePref: UserPreference) => {
    // 같은 학과인 경우 매칭 제외
    if (female.department === male.department) {
      return { score: 0, details: { 제외사유: '같은 학과' } };
    }

    let score = 0;
    const details: any = {};

    // 등급 차이에 따른 점수 차감 (한 단계당 -2점)
    const femaleGradeVal = female.classification ? (gradeValues[female.classification] || 0) : 0;
    const maleGradeVal = male.classification ? (gradeValues[male.classification] || 0) : 0;
    const gradeDiff = Math.abs(maleGradeVal - femaleGradeVal);
    const gradePenalty = gradeDiff * 2;
    
    details.등급_점수 = {
      차감점수: -gradePenalty,
      여성등급: female.classification,
      남성등급: male.classification,
      등급차이: gradeDiff
    };
    
    // 1. 나이 선호도 점수 (35점)
    const ageDiff = Math.abs(male.age - female.age);
    let ageScore = 0;
    
    switch (femalePref.preferred_age_type) {
      case '동갑':
        ageScore = ageDiff === 0 ? 35 : Math.max(0, 25 - (ageDiff * 5));
        break;
      case '연상':
        ageScore = male.age > female.age ? Math.max(0, 35 - (ageDiff * 3)) : 0;
        break;
      case '연하':
        ageScore = male.age < female.age ? Math.max(0, 35 - (ageDiff * 3)) : 0;
        break;
      case '상관없음':
        ageScore = Math.max(0, 25 - (ageDiff * 2));
        break;
    }
    
    details.나이_점수 = { 점수: ageScore, 차이: ageDiff, 선호유형: femalePref.preferred_age_type };
    score += ageScore;

    // 2. 키 선호도 점수 (20점)
    const heightScore = (male.height >= femalePref.preferred_height_min && 
                        male.height <= femalePref.preferred_height_max) ? 20 : 0;
    details.키_점수 = { 
      점수: heightScore, 
      남성키: male.height,
      선호범위: `${femalePref.preferred_height_min}-${femalePref.preferred_height_max}cm`
    };
    score += heightScore;

    // 3. MBTI 선호도 점수 (20점)
    let mbtiScore = 0;
    if (femalePref.preferred_mbti.includes(male.mbti)) {
      mbtiScore = 20;
    } else if (!femalePref.disliked_mbti?.includes(male.mbti)) {
      mbtiScore = 10;
    }
    
    details.MBTI_점수 = { 
      점수: mbtiScore, 
      남성MBTI: male.mbti,
      선호MBTI: femalePref.preferred_mbti,
      비선호MBTI: femalePref.disliked_mbti
    };
    score += mbtiScore;

    // 4. 선호 성격 매칭 점수 (15점)
    const matchedPersonalities = male.personalities.filter(p => 
      femalePref.preferred_personalities.includes(p)
    );
    const personalityScore = Math.round((matchedPersonalities.length / femalePref.preferred_personalities.length) * 15);
    details.성격_점수 = { 
      점수: personalityScore, 
      매칭성격: matchedPersonalities,
      선호성격: femalePref.preferred_personalities
    };
    score += personalityScore;

    // 5. 선호 데이트 스타일 매칭 점수 (10점)
    const matchedDatingStyles = male.dating_styles.filter(s => 
      femalePref.preferred_dating_styles.includes(s)
    );
    const datingStyleScore = Math.round((matchedDatingStyles.length / femalePref.preferred_dating_styles.length) * 10);
    details.데이트스타일_점수 = { 
      점수: datingStyleScore, 
      매칭스타일: matchedDatingStyles,
      선호스타일: femalePref.preferred_dating_styles
    };
    score += datingStyleScore;

    // 6. 흡연/음주/타투 선호도 점수 (총 15점)
    let lifestyleScore = 0;
    const lifestyleDetails: any = {};

    // 흡연 (5점)
    if (male.smoking === femalePref.preferred_smoking) {
      lifestyleScore += 5;
      lifestyleDetails.흡연 = '일치';
    } else {
      lifestyleDetails.흡연 = '불일치';
    }

    // 음주 (5점)
    if (male.drinking === femalePref.preferred_drinking) {
      lifestyleScore += 5;
      lifestyleDetails.음주 = '일치';
    } else {
      lifestyleDetails.음주 = '불일치';
    }

    // 타투 (5점)
    if (male.tattoo === femalePref.preferred_tattoo) {
      lifestyleScore += 5;
      lifestyleDetails.타투 = '일치';
    } else {
      lifestyleDetails.타투 = '불일치';
    }

    details.생활습관_점수 = {
      점수: lifestyleScore,
      상세: lifestyleDetails
    };
    score += lifestyleScore;

    // 최종 점수에서 등급 차이만큼 차감
    const finalScore = Math.max(0, score - gradePenalty);
    details.총점 = finalScore;
    return { score: finalScore, details };
  };

  const hasRequiredData = (profile: Profile, preferences: UserPreference): boolean => {
    // 프로필 필수 데이터 체크
    const validProfile = !!(
      profile?.name &&
      profile?.age &&
      profile?.department &&
      profile?.mbti &&
      profile?.height &&
      Array.isArray(profile?.personalities) && profile.personalities.length > 0 &&
      Array.isArray(profile?.dating_styles) && profile.dating_styles.length > 0
    );

    // 선호도 필수 데이터 체크
    const validPreferences = !!(
      preferences?.preferred_age_type &&
      preferences?.preferred_height_min &&
      preferences?.preferred_height_max &&
      Array.isArray(preferences?.preferred_mbti) && preferences.preferred_mbti.length > 0 &&
      Array.isArray(preferences?.preferred_personalities) && preferences.preferred_personalities.length > 0 &&
      Array.isArray(preferences?.preferred_dating_styles) && preferences.preferred_dating_styles.length > 0
    );

    return validProfile && validPreferences;
  };

  const startMatching = async () => {
  try {
    setIsMatchingLoading(true);
    console.log('=== 매칭 프로세스 시작 ===');

    const supabase = createClient();

    // 1. 여성 프로필
    console.log('1. 여성 프로필 데이터 조회 중...');
    const { data: femaleProfiles, error: femaleError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'user')
      .eq('gender', 'female')
      .not('name', 'is', null)
      .not('age', 'is', null)
      .not('department', 'is', null)
      .not('mbti', 'is', null)
      .not('height', 'is', null)
      .not('personalities', 'is', null)
      .not('dating_styles', 'is', null);

    if (femaleError) throw femaleError;

    const validFemaleProfiles = femaleProfiles?.filter(profile =>
      profile.name?.trim() &&
      profile.age > 0 &&
      profile.department?.trim() &&
      profile.mbti?.trim() &&
      profile.height > 0 &&
      Array.isArray(profile.personalities) && profile.personalities.length > 0 &&
      Array.isArray(profile.dating_styles) && profile.dating_styles.length > 0
    ) || [];

    if (validFemaleProfiles.length === 0) {
      throw new Error('매칭 가능한 여성 프로필이 없습니다.');
    }

    // 2. 여성 선호도
    console.log('2. 여성 선호도 데이터 조회 중...');
    const femaleUserIds = validFemaleProfiles.map(p => p.user_id);
    const { data: femalePreferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .in('user_id', femaleUserIds)
      .not('preferred_age_type', 'is', null)
      .not('preferred_height_min', 'is', null)
      .not('preferred_height_max', 'is', null)
      .not('preferred_mbti', 'is', null)
      .not('preferred_personalities', 'is', null)
      .not('preferred_dating_styles', 'is', null);

    if (prefError) throw prefError;

    const validFemales = validFemaleProfiles
      .map(profile => {
        const preferences = femalePreferences?.find(pref => pref.user_id === profile.user_id);
        if (preferences && hasRequiredData(profile, preferences)) {
          return { ...profile, preferences };
        }
        return null;
      })
      .filter((female): female is (typeof female & { preferences: UserPreference }) =>
        female !== null
      );

    const matchResults: any[] = [];
    const matchedUsers = new Set<string>();
    const batchSize = 100;

    console.log('5. 매칭 로직 실행 중...');
    for (const female of validFemales) {
      if (matchedUsers.has(female.user_id)) continue;

      let offset = 0;
      let bestMatch: any = null;
      let highestScore = -1;

      while (true) {
        const { data: maleBatch, error: maleError } = await supabase
          .from('profiles')
          .select('id, user_id, name, age, department, mbti, height, personalities, dating_styles, smoking, drinking, tattoo')
          .eq('role', 'user')
          .eq('gender', 'male')
          .not('name', 'is', null)
          .not('age', 'is', null)
          .not('department', 'is', null)
          .not('mbti', 'is', null)
          .not('height', 'is', null)
          .not('personalities', 'is', null)
          .not('dating_styles', 'is', null)
          .range(offset, offset + batchSize - 1);

        if (maleError) {
          console.error('남성 프로필 조회 실패:', maleError);
          break;
        }

        if (!maleBatch || maleBatch.length === 0) break;

        const validMales = maleBatch.filter(male =>
          male.name?.trim() &&
          male.age > 0 &&
          male.department?.trim() &&
          male.mbti?.trim() &&
          male.height > 0 &&
          Array.isArray(male.personalities) && male.personalities.length > 0 &&
          Array.isArray(male.dating_styles) && male.dating_styles.length > 0 &&
          !matchedUsers.has(male.user_id)
        );

        for (const male of validMales) {
          const { score, details } = calculateMatchScore(
            { ...female, gender: female.gender === '남성' ? 'male' : 'female' },
            { ...male, gender: 'male' },
            female.preferences
          );
          if (score > highestScore) {
            highestScore = score;
            bestMatch = { male, score, details };
          }
        }

        offset += batchSize;
      }

      if (bestMatch && highestScore > 0) {
        try {
          const { error: matchError } = await supabase
            .from('matches')
            .insert([{
              user1_id: bestMatch.male.user_id,
              user2_id: female.user_id,
              score: bestMatch.score
            }]);

          if (matchError) {
            console.error('매칭 결과 저장 실패:', matchError);
          } else {
            console.log(`✅ 매칭 성사: ${female.name} ↔ ${bestMatch.male.name}`);
            matchResults.push({
              female,
              male: bestMatch.male,
              score: bestMatch.score,
              details: bestMatch.details
            });
            matchedUsers.add(female.user_id);
            matchedUsers.add(bestMatch.male.user_id);
          }
        } catch (error) {
          console.error('매칭 결과 저장 중 오류 발생:', error);
        }
      } else {
        console.log(`❌ ${female.name}님과 매칭 가능한 남성이 없습니다.`);
      }
    }

    console.log('\n=== 최종 매칭 결과 ===');
    console.log(`총 매칭 성사 건수: ${matchResults.length}`);
    console.log(`매칭된 사용자 수: ${matchedUsers.size}`);

    setMatchResults(matchResults);
    setMessage({
      type: 'success',
      content: `매칭이 완료되었습니다. 총 ${matchResults.length}쌍이 매칭되었습니다.`
    });
  } catch (error) {
    console.error('매칭 프로세스 오류:', error);
    setMessage({
      type: 'error',
      content: error instanceof Error ? error.message : '매칭 중 오류가 발생했습니다.'
    });
  } finally {
    setIsMatchingLoading(false);
  }
};


  const fetchMatchedUsers = async () => {
    try {
      setIsMatchListLoading(true);
      console.log('매칭된 유저 목록 조회 시작');
      
      const response = await fetch('/api/admin/matched-users');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('매칭된 유저 데이터:', data);
      
      setMatchedUsers(data.matches || []);
    } catch (error) {
      console.error('매칭된 유저 목록 조회 실패:', error);
      setMessage({
        type: 'error',
        content: '매칭된 유저 목록을 불러오는데 실패했습니다.'
      });
    } finally {
      setIsMatchListLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Grid container spacing={3}>
          {/* 매칭 시간 설정 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <h2 className="text-xl font-bold mb-4">매칭 시간 설정</h2>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        매칭 시간
                      </label>
                      <input
                        type="datetime-local"
                        value={matchingDate}
                        onChange={(e) => setMatchingDate(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary-DEFAULT text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '처리 중...' : '매칭 시간 설정'}
                    </button>
                  </form>
                  
                  {/* 현재 설정된 시간 표시 */}
                  <div className={`bg-blue-50 border border-blue-200 p-4 rounded-lg shadow max-w-md ${!savedMatchingTime ? 'hidden' : ''}`}>
                    <h3 className="text-sm font-medium text-blue-800 mb-2">현재 설정된 매칭 시간</h3>
                    <div className="text-gray-700">
                      {savedMatchingTime ? (
                        <>
                          <p className="text-lg font-medium text-blue-700 mb-1">
                            {new Date(savedMatchingTime).toLocaleString('ko-KR', {
                              timeZone: 'Asia/Seoul',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(savedMatchingTime).toLocaleString('ko-KR', { 
                              timeZone: 'Asia/Seoul',
                              weekday: 'long' 
                            })}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">설정된 매칭 시간이 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>
          
          {/* 회원 매칭 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <h2 className="text-xl font-bold mb-4">회원 매칭</h2>
                <div className="max-w-md space-y-4">
                  <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-700 mb-4">
                      회원가입된 전체 사용자(남/여)를 불러와 알고리즘에 따라 1:1 매칭을 수행합니다. 매칭 결과는 지정된 시간에 사용자에게 공개됩니다.
                    </p>
                    <button
                      onClick={startMatching}
                      disabled={isMatchingLoading}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isMatchingLoading ? '매칭 진행 중...' : '매칭 시작'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          {/* 회원가입 제어 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <h2 className="text-xl font-bold mb-4">회원가입 제어</h2>
                <div className="max-w-md space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                    <div>
                      <p className="font-medium">회원가입 상태</p>
                      <p className={`text-sm ${isSignupEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {isSignupEnabled ? '활성화' : '비활성화'}
                      </p>
                    </div>
                    <button
                      onClick={toggleSignup}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        isSignupEnabled
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } disabled:opacity-50`}
                    >
                      {isLoading ? '처리 중...' : isSignupEnabled ? '비활성화하기' : '활성화하기'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">매칭된 유저 리스트</h2>
          <div className="mb-4">
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchMatchedUsers}
              disabled={isMatchListLoading}
              className="mb-4"
            >
              {isMatchListLoading ? <CircularProgress size={24} /> : '목록 새로고침'}
            </Button>
          </div>
          
          {isMatchListLoading ? (
            <div className="flex justify-center my-4">
              <CircularProgress />
            </div>
          ) : matchedUsers.length > 0 ? (
            <TableContainer component={Paper} className="mb-8">
              <Table sx={{ minWidth: 650 }} aria-label="매칭된 유저 테이블">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>순서</TableCell>
                    <TableCell>등급</TableCell>
                    <TableCell>여성 유저</TableCell>
                    <TableCell>남성 유저</TableCell>
                    <TableCell>상세정보</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matchedUsers.map((match, index) => (
                    <TableRow
                      key={match.id}
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip 
                            label={`여성: ${match.user2.classification || 'N/A'}`}
                            color={
                              match.user2.classification === 'S' ? 'primary' :
                              match.user2.classification === 'A' ? 'success' :
                              match.user2.classification === 'B' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                          <Chip 
                            label={`남성: ${match.user1.classification || 'N/A'}`}
                            color={
                              match.user1.classification === 'S' ? 'primary' :
                              match.user1.classification === 'A' ? 'success' :
                              match.user1.classification === 'B' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" component="div">
                          <strong>이름:</strong> {match.user2.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>인스타:</strong> {match.user2.instagram_id || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>나이:</strong> {match.user2.age}세
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" component="div">
                          <strong>이름:</strong> {match.user1.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>인스타:</strong> {match.user1.instagram_id || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>나이:</strong> {match.user1.age}세
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Link href={`/admin/users/${match.user2.id}`} passHref>
                            <Button variant="outlined" size="small" color="primary">
                              여성 상세정보
                            </Button>
                          </Link>
                          <Link href={`/admin/users/${match.user1.id}`} passHref>
                            <Button variant="outlined" size="small" color="primary">
                              남성 상세정보
                            </Button>
                          </Link>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" className="my-4">
              매칭된 유저가 없습니다.
            </Typography>
          )}
        </div>
      </div>

      {/* 매칭 결과 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            매칭된 유저 목록
          </Typography>
          {matchResults.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>여성</TableCell>
                    <TableCell>남성</TableCell>
                    <TableCell>매칭 점수</TableCell>
                    <TableCell>상세 정보</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matchResults.map((match, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2">
                          {match.female.name} ({match.female.age}세)<br/>
                          {match.female.department}<br/>
                          {match.female.mbti}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {match.male.name} ({match.male.age}세)<br/>
                          {match.male.department}<br/>
                          {match.male.mbti}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${match.score}점`} 
                          color={match.score >= 80 ? "success" : 
                                 match.score >= 60 ? "primary" : 
                                 "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" component="pre" style={{whiteSpace: 'pre-wrap'}}>
                          {Object.entries(match.details)
                            .filter(([key]) => key !== '총점')
                            .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
                            .join('\n')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary" align="center">
              매칭된 유저가 없습니다.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 메시지 표시 */}
      {message.content && (
        <div className={`max-w-md p-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.content}
        </div>
      )}
    </div>
  );
} 