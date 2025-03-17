'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
    if (!user) {
      router.push('/onboarding');
    }
  }, [user, router]);

  useEffect(() => {
    // 온보딩 데이터 확인
    const onboardingData = localStorage.getItem('onboardingProfile');
    if (!onboardingData) {
      console.log('온보딩 데이터 없음, 온보딩 페이지로 이동');
      router.push('/onboarding');
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
  }, [router]);

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
      // 온보딩 데이터 확인
      const onboardingData = localStorage.getItem('onboardingProfile');
      if (!onboardingData) {
        console.log('온보딩 데이터 없음, 온보딩 페이지로 이동');
        showTemporaryModal('온보딩 정보가 없습니다. 처음부터 다시 시작해주세요.');
        router.push('/onboarding');
        return;
      }

      // 프로필 데이터 저장
      const profileData = {
        ...formData,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('profile', JSON.stringify(profileData));
      console.log('프로필 데이터 저장됨:', profileData);

      // 홈 페이지로 이동
      router.push('/home');
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