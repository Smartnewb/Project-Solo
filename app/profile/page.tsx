'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClientSupabaseClient } from '@/utils/supabase';

interface ProfileForm {
  height: string;
  personalities: string[];
  datingStyles: string[];
  idealLifestyles: string[];
  interests: string[];
  drinking: string;
  smoking: string;
  tattoo: string;
  mbti: string;
  instagramId?: string;
}

export default function Profile() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const supabase = createClientSupabaseClient();
  const [formData, setFormData] = useState<ProfileForm>({
    height: '',
    personalities: [],
    datingStyles: [],
    idealLifestyles: [],
    interests: [],
    drinking: '',
    smoking: '',
    tattoo: '',
    mbti: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    // 세션과 프로필 정보 확인
    const checkProfileCompletion = async () => {
      try {
        // 온보딩 데이터가 이미 localStorage에 있는지 먼저 확인
        const onboardingData = localStorage.getItem('onboardingProfile');
        
        // 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          console.error('세션 확인 오류:', sessionError);
          router.push('/');
          return;
        }
        
        // 프로필 데이터 확인
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // 프로필이 없으면 온보딩으로 이동
            console.log('프로필이 없습니다. 온보딩 페이지로 이동합니다.');
            router.push('/onboarding');
            return;
          } else {
            console.error('프로필 조회 오류:', profileError);
            return;
          }
        }
        
        // 추가 프로필 정보가 이미 존재하는지 확인
        // personalities가 문자열이라면 JSON으로 파싱 시도
        let hasPersonalitiesData = false;
        if (profileData.personalities) {
          if (typeof profileData.personalities === 'string') {
            try {
              const parsed = JSON.parse(profileData.personalities);
              hasPersonalitiesData = Array.isArray(parsed) && parsed.length > 0;
            } catch (e) {
              hasPersonalitiesData = false;
            }
          } else {
            hasPersonalitiesData = true;
          }
        }
        
        // 이미 추가 프로필 정보가 있으면 홈으로 이동
        if (hasPersonalitiesData || profileData.dating_styles || profileData.interests) {
          console.log('이미 추가 프로필 정보가 있습니다. 홈 페이지로 이동합니다.');
          router.push('/home');
          return;
        }
        
        // 온보딩 데이터가 없으면 localStorage에 저장
        if (!onboardingData) {
          console.log('온보딩 데이터를 localStorage에 저장합니다.');
          localStorage.setItem('onboardingProfile', JSON.stringify(profileData));
        }
      } catch (error) {
        console.error('프로필 확인 중 오류:', error);
      }
    };
    
    if (user) {
      checkProfileCompletion();
    }
  }, [user, router, supabase]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    
    // 온보딩 데이터 확인
    const onboardingData = localStorage.getItem('onboardingProfile');
    if (!onboardingData) {
      // 이미 첫 번째 useEffect에서 프로필 데이터를 확인하고 있으므로,
      // 여기서는 onboarding으로 리다이렉트하지 않고 기다립니다.
      console.log('온보딩 데이터가 localStorage에 없습니다. 첫 번째 useEffect에서 확인 중...');
      return;
    }

    // 수정 모드인 경우 기존 데이터 불러오기
    const editData = localStorage.getItem('editProfileData');
    if (editData) {
      const parsedData = JSON.parse(editData);
      setFormData({
        height: parsedData.height || '',
        personalities: parsedData.personalities || [],
        datingStyles: parsedData.datingStyles || [],
        idealLifestyles: parsedData.idealLifestyles || [],
        interests: parsedData.interests || [],
        drinking: parsedData.drinking || '',
        smoking: parsedData.smoking || '',
        tattoo: parsedData.tattoo || '',
        mbti: parsedData.mbti || '',
        instagramId: parsedData.instagramId || '',
      });
      // 수정이 완료되면 editProfileData 삭제
      localStorage.removeItem('editProfileData');
    }
  }, [user, router]);

  // 선택 옵션들
  const heightOptions = [
    '155cm 이하',
    '156~160cm',
    '161~165cm',
    '166~170cm',
    '171~175cm',
    '176cm 이상'
  ];

  const personalityOptions = [
    '활발한 성격',
    '조용한 성격',
    '배려심 많은 사람',
    '리더십 있는 사람',
    '유머 감각 있는 사람',
    '감성적인 사람',
    '모험을 즐기는 사람',
    '계획적인 스타일',
    '즉흥적인 스타일'
  ];

  const datingStyleOptions = [
    '적극적인 스타일',
    '다정다감한 스타일',
    '친구처럼 지내는 스타일',
    '츤데레 스타일',
    '표현을 잘 안 하지만 속은 다정한 스타일',
    '자유로운 연애를 선호하는 스타일'
  ];

  const lifestyleOptions = [
    '아침형 인간',
    '밤형 인간',
    '집순이 / 집돌이',
    '여행을 자주 다니는 편',
    '운동을 즐기는 편',
    '게임을 자주 하는 편',
    '카페에서 노는 걸 좋아함',
    '액티비티 활동을 좋아함'
  ];

  const drinkingOptions = [
    '자주 마시는 편',
    '가끔 마시는 편',
    '거의 안 마시는 편',
    '전혀 마시지 않음'
  ];

  const smokingOptions = [
    '네, 흡연자입니다',
    '금연 중입니다',
    '비흡연자입니다'
  ];

  const tattooOptions = [
    '네, 있습니다',
    '작은 문신이 있습니다',
    '없습니다'
  ];

  const interestOptions = [
    '영화/드라마',
    '음악',
    '독서',
    '게임',
    '요리',
    '여행',
    '운동',
    '패션',
    '사진/영상',
    '그림',
    '댄스',
    '반려동물',
    '카페',
    '맛집 탐방',
    '공연/전시',
    '재테크',
    '자기계발',
    '봉사활동'
  ];

  const mbtiOptions = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  const handleMultiSelect = (category: keyof ProfileForm, value: string, maxCount: number) => {
    setFormData(prev => {
      const currentArray = prev[category] as string[];
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [category]: currentArray.filter(item => item !== value)
        };
      }
      if (currentArray.length >= maxCount) {
        showTemporaryModal(`최대 ${maxCount}개까지 선택 가능합니다`);
        return prev;
      }
      return {
        ...prev,
        [category]: [...currentArray, value]
      };
    });
  };

  const handleSingleSelect = (category: keyof ProfileForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const showTemporaryModal = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.height) {
      showTemporaryModal('키를 선택해주세요');
      return;
    }

    try {
      console.log('프로필 저장 시작');
      
      // 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.error('세션 확인 오류:', sessionError);
        showTemporaryModal('인증 상태를 확인할 수 없습니다. 다시 로그인해주세요.');
        router.push('/');
        return;
      }

      console.log('세션 정보:', session);
      
      // 온보딩 데이터 확인 - localStorage에 없을 경우 직접 DB에서 가져옴
      let userData = null;
      const onboardingData = localStorage.getItem('onboardingProfile');
      
      if (onboardingData) {
        userData = JSON.parse(onboardingData);
        console.log('localStorage에서 온보딩 데이터 로드:', userData);
      } else {
        // localStorage에 없으면 DB에서 직접 가져오기
        console.log('localStorage에 온보딩 데이터 없음, DB에서 조회');
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('프로필 조회 오류:', profileError);
          showTemporaryModal('프로필 정보를 확인할 수 없습니다. 다시 시도해주세요.');
          return;
        }
        
        if (existingProfile) {
          userData = existingProfile;
          console.log('DB에서 프로필 데이터 로드:', userData);
          // localStorage에도 저장
          localStorage.setItem('onboardingProfile', JSON.stringify(userData));
        } else {
          console.log('DB에도 프로필 데이터 없음, 기본 정보 생성');
          // 기본 정보만 사용
          userData = {
            user_id: session.user.id,
            name: session.user.user_metadata?.name || '사용자'
          };
        }
      }

      // height 값에서 숫자만 추출 (예: "171~175cm"에서 173)
      const extractHeight = (heightStr: string): number => {
        // 범위인 경우 중간값 사용
        if (heightStr.includes('~')) {
          const [min, max] = heightStr.replace(/[^0-9~]/g, '').split('~').map(Number);
          return Math.floor((min + max) / 2);
        }
        // 이하/이상인 경우
        if (heightStr.includes('이하')) {
          return 150; // 155cm 이하는 150으로 기본값
        }
        if (heightStr.includes('이상')) {
          return 180; // 176cm 이상은 180으로 기본값
        }
        // 숫자만 추출
        const match = heightStr.match(/\d+/);
        return match ? parseInt(match[0]) : 170; // 기본값 170
      };

      // personality 배열이 비어있는지 확인
      if (formData.personalities.length === 0) {
        showTemporaryModal('성격을 하나 이상 선택해주세요');
        return;
      }

      // 추가 프로필 데이터 준비
      const additionalProfileData = {
        height: extractHeight(formData.height),
        personalities: JSON.stringify(formData.personalities),
        dating_styles: JSON.stringify(formData.datingStyles),
        ideal_lifestyles: JSON.stringify(formData.idealLifestyles),
        interests: JSON.stringify(formData.interests),
        drinking: formData.drinking,
        smoking: formData.smoking,
        tattoo: formData.tattoo,
        mbti: formData.mbti,
        updated_at: new Date().toISOString()
      };
      
      console.log('추가 프로필 데이터:', additionalProfileData);
      console.log('기존 사용자 데이터:', userData);
      console.log('user_id:', session.user.id);

      try {
        let saveResult;
        
        if (userData.id) {
          // 프로필이 이미 있으면 업데이트
          console.log('기존 프로필 업데이트...');
          
          // 업데이트할 데이터 준비
          const updateData = {
            ...additionalProfileData
          };
          
          console.log('업데이트할 데이터:', updateData);
          
          saveResult = await supabase
            .from('profiles')
            .update(updateData)
            .eq('user_id', session.user.id);
        } else {
          // 프로필이 없으면 새로 생성
          console.log('새 프로필 생성...');
          
          // 삽입할 데이터 준비
          const insertData = {
            ...additionalProfileData,
            user_id: session.user.id,
            name: userData.name || session.user.user_metadata?.name || '사용자',
            university: userData.university || '',
            department: userData.department || '',
            grade: userData.grade || '',
            student_id: userData.student_id || '',
            instagram_id: userData.instagram_id || '',
            avatar_url: userData.avatar_url || ''
          };
          
          console.log('삽입할 데이터:', insertData);
          
          saveResult = await supabase
            .from('profiles')
            .insert(insertData);
        }
        
        const { error: saveError } = saveResult;
        console.log('저장 결과:', saveResult);
        
        if (saveError) {
          console.error('프로필 저장 오류:', saveError);
          
          // 더 자세한 오류 정보 로깅
          console.log('오류 코드:', saveError.code);
          console.log('오류 메시지:', saveError.message);
          console.log('오류 상세:', saveError.details);
          
          // 외래 키 제약 조건 위반 오류인 경우 특별 처리
          if (saveError.code === '23503') {
            console.log('외래 키 제약 조건 위반, auth.users 테이블에 사용자 생성 확인 필요');
            showTemporaryModal('사용자 인증 정보에 문제가 있습니다. 다시 로그인해주세요.');
            router.push('/');
            return;
          }
          
          showTemporaryModal('프로필 정보 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
          return;
        }
        
        console.log('프로필 저장 성공');
        
        // 저장 후 프로필 데이터 다시 조회하여 확인
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        console.log('업데이트된 프로필:', updatedProfile);
        
        // 프로필 데이터도 localStorage에 저장
        if (updatedProfile) {
          localStorage.setItem('profile', JSON.stringify({
            ...updatedProfile,
            personalities: formData.personalities, // 원래 배열 형태로 저장
            dating_styles: formData.datingStyles,
            ideal_lifestyles: formData.idealLifestyles,
            interests: formData.interests
          }));
          localStorage.setItem('onboardingProfile', JSON.stringify(updatedProfile));
        } else {
          console.warn('업데이트된 프로필을 조회할 수 없음');
          localStorage.setItem('profile', JSON.stringify({
            ...userData,
            ...additionalProfileData,
            personalities: formData.personalities,
            dating_styles: formData.datingStyles,
            ideal_lifestyles: formData.idealLifestyles,
            interests: formData.interests
          }));
        }
        
        console.log('프로필 데이터 localStorage에 저장됨');
        
        // 성공 메시지
        showTemporaryModal('프로필이 성공적으로 저장되었습니다!');
        
        // 잠시 후 홈 페이지로 이동
        setTimeout(() => {
          router.push('/home');
        }, 2000);
      } catch (error) {
        console.error('프로필 저장 중 예외 발생:', error);
        showTemporaryModal('프로필 정보 저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('프로필 저장 에러:', error);
      showTemporaryModal('프로필 정보 저장 중 오류가 발생했습니다.');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 키 선택 */}
          <div className="card space-y-4">
            <h2 className="text-h2">본인의 키</h2>
            <div className="grid grid-cols-2 gap-2">
              {heightOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect('height', option)}
                  className={`btn-select ${formData.height === option ? 'btn-selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 성격 선택 */}
          <div className="card space-y-4">
            <h2 className="text-h2">본인의 성격 (최대 3개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {personalityOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiSelect('personalities', option, 3)}
                  className={`btn-select ${formData.personalities.includes(option) ? 'btn-selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 연애 스타일 선택 */}
          <div className="card space-y-4">
            <h2 className="text-h2">본인의 연애 스타일 (최대 2개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {datingStyleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiSelect('datingStyles', option, 2)}
                  className={`btn-select ${formData.datingStyles.includes(option) ? 'btn-selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 관심사 선택 */}
          <div className="card space-y-4">
            <h2 className="text-h2">관심사 (최대 5개)</h2>
            <div className="grid grid-cols-4 gap-2">
              {interestOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiSelect('interests', option, 5)}
                  className={`btn-select text-sm ${formData.interests.includes(option) ? 'btn-selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 이상형 라이프스타일 선택 */}
          <div className="card space-y-4">
            <h2 className="text-h2">이상형의 라이프스타일 (최대 3개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {lifestyleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiSelect('idealLifestyles', option, 3)}
                  className={`btn-select ${formData.idealLifestyles.includes(option) ? 'btn-selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 술, 담배, 문신 여부 */}
          <div className="card space-y-6">
            <h2 className="text-h2">추가 정보</h2>
            
            <div className="space-y-4">
              <h3 className="text-h3">술을 즐기는 편인가요?</h3>
              <div className="grid grid-cols-2 gap-2">
                {drinkingOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSingleSelect('drinking', option)}
                    className={`btn-select ${formData.drinking === option ? 'btn-selected' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-h3">담배를 피우시나요?</h3>
              <div className="grid grid-cols-2 gap-2">
                {smokingOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSingleSelect('smoking', option)}
                    className={`btn-select ${formData.smoking === option ? 'btn-selected' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-h3">문신이 있나요?</h3>
              <div className="grid grid-cols-2 gap-2">
                {tattooOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSingleSelect('tattoo', option)}
                    className={`btn-select ${formData.tattoo === option ? 'btn-selected' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MBTI 설정 */}
          <div className="card space-y-4">
            <h2 className="text-h2">MBTI 설정</h2>
            <div className="grid grid-cols-4 gap-2">
              {mbtiOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect('mbti', option)}
                  className={`btn-select ${formData.mbti === option ? 'btn-selected' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 인스타그램 ID 표시 */}
          {formData.instagramId && (
            <div className="card space-y-4">
              <h2 className="text-h2">인스타그램</h2>
              <a
                href={`https://www.instagram.com/${formData.instagramId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {formData.instagramId}
              </a>
            </div>
          )}

          {/* 다음 버튼 */}
          <button type="submit" className="btn-primary w-full">
            완료
          </button>
        </form>
      </div>

      {/* 알림 모달 */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-50 absolute inset-0"></div>
          <div className="bg-white rounded-lg p-6 shadow-xl z-10 transform transition-all">
            <p className="text-center">{modalMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
} 