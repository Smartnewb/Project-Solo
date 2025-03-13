'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

// 대학별 학과 정보 타입 정의
type University = string;
type Department = string;
type DepartmentsByUniversity = Record<University, Department[]>;

interface ProfileForm {
  height: string;
  personalities: string[];
  personalityDescription: string;
  datingStyles: string[];
  datingStyleDescription: string;
  idealLifestyles: string[];
  lifestyleDescription: string;
  drinking: string;
  smoking: string;
  tattoo: string;
}

export default function Profile() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileForm>({
    height: '',
    personalities: [],
    personalityDescription: '',
    datingStyles: [],
    datingStyleDescription: '',
    idealLifestyles: [],
    lifestyleDescription: '',
    drinking: '',
    smoking: '',
    tattoo: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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
      localStorage.setItem('profileData', JSON.stringify(formData));
      router.push('/home');
    } catch (error) {
      console.error('프로필 저장 에러:', error);
      showTemporaryModal('프로필 정보 저장 중 오류가 발생했습니다.');
    }
  };

  // 대전광역시 대학교 목록
  const universityOptions = [
    '충남대학교', '한남대학교', '배재대학교', '우송대학교', '대전대학교', 
    '목원대학교', '침례신학대학교', '대전가톨릭대학교', '대전신학대학교',
    '을지대학교', '대전보건대학교', '대전과학기술대학교', '대전문화예술대학교',
    '대전여자대학교', 'KC대학교', '대전폴리텍대학', '한국영상대학교',
    '한밭대학교', '우송정보대학', '대덕대학교', '한국과학기술원(KAIST)'
  ];

  // 대학별 학과 정보
  const departmentsByUniversity: DepartmentsByUniversity = {
    '충남대학교': [
      '신소재공학과',
      '화학생명공학',
      '기계공학과',
      '설비공학과',
      '산업경영공학과',
      '창의융합학과',
      '전기공학과',
      '전자공학과',
      '컴퓨터공학과',
      '정보통신공학과',
      '지능미디어공학과',
      '모바일융합공학과',
      '인공지능소프트웨어학과',
      '건축학과',
      '도시공학과',
      '산업디자인학과',
      '시각·영상디자인학과',
      '국어국문학과', '영어영문학과', '수학과', '물리학과', '화학과', '생물학과',
      '경영학과', '경제학과', '심리학과', '행정학과', '의학과', '간호학과'
    ],
    '한남대학교': [
      '신소재공학과',
      '화학생명공학',
      '기계공학과',
      '설비공학과',
      '산업경영공학과',
      '창의융합학과',
      '전기공학과',
      '전자공학과',
      '컴퓨터공학과',
      '정보통신공학과',
      '지능미디어공학과',
      '모바일융합공학과',
      '인공지능소프트웨어학과',
      '건축학과',
      '도시공학과',
      '산업디자인학과',
      '시각·영상디자인학과',
      '국어국문학과', '영어영문학과', '경영학과', '회계학과', '무역학과',
      '미디어영상학과'
    ],
    '배재대학교': [
      '신소재공학과',
      '화학생명공학',
      '기계공학과',
      '설비공학과',
      '산업경영공학과',
      '창의융합학과',
      '전기공학과',
      '전자공학과',
      '컴퓨터공학과',
      '정보통신공학과',
      '지능미디어공학과',
      '모바일융합공학과',
      '인공지능소프트웨어학과',
      '건축학과',
      '도시공학과',
      '산업디자인학과',
      '시각·영상디자인학과',
      '경영학과', '게임공학과', '영어영문학과',
      '한국어문학과', '심리상담학과', '미디어콘텐츠학과'
    ],
    '우송대학교': [
      '신소재공학과',
      '화학생명공학',
      '기계공학과',
      '설비공학과',
      '산업경영공학과',
      '창의융합학과',
      '전기공학과',
      '전자공학과',
      '컴퓨터공학과',
      '정보통신공학과',
      '지능미디어공학과',
      '모바일융합공학과',
      '인공지능소프트웨어학과',
      '건축학과',
      '도시공학과',
      '산업디자인학과',
      '시각·영상디자인학과',
      '글로벌미디어영상학과', '글로벌조리학과', '간호학과', '물리치료학과',
      '사회복지학과', '글로벌호텔매니지먼트학과', 'AI빅데이터학과'
    ],
    '대전대학교': [
      '한의예과', '간호학과', '물리치료학과', '경영학과', '컴퓨터공학과',
      '정보보안학과', '영미언어문화학과', '건축공학과'
    ],
    '한밭대학교': [
      '신소재공학과',
      '화학생명공학',
      '기계공학과',
      '설비공학과',
      '산업경영공학과',
      '창의융합학과',
      '전기공학과',
      '전자공학과',
      '컴퓨터공학과',
      '정보통신공학과',
      '지능미디어공학과',
      '모바일융합공학과',
      '인공지능소프트웨어학과',
      '건축학과',
      '도시공학과',
      '산업디자인학과',
      '시각·영상디자인학과',
      '건설환경공학과',
      '공공행정학과'
    ],
    '한국과학기술원(KAIST)': [
      '물리학과', '수리과학과', '화학과', '생명과학과',
      '항공우주공학과', '전기및전자공학부', '전산학부', '산업및시스템공학과'
    ]
    // 나머지 대학들도 추가...
  };

  // 대학 선택 시 학과 변경 처리
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUni = e.target.value;
    setSelectedUniversity(selectedUni);
    setFormData(prev => ({
      ...prev,
      university: selectedUni,
      department: '',
      departmentSearch: ''
    }));
  };

  const filteredDepartments = selectedUniversity
    ? departmentsByUniversity[selectedUniversity]?.filter(dept =>
        dept.toLowerCase().includes(departmentSearch.toLowerCase())
      ) || []
    : [];

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
            <textarea
              value={formData.personalityDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, personalityDescription: e.target.value }))}
              placeholder="추가 설명 (선택 사항) (예: '처음엔 낯가리지만 친해지면 장난도 잘 쳐요!')"
              className="input-field h-24"
              maxLength={200}
            />
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
            <textarea
              value={formData.datingStyleDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, datingStyleDescription: e.target.value }))}
              placeholder="추가 설명 (선택 사항)"
              className="input-field h-24"
              maxLength={200}
            />
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
            <textarea
              value={formData.lifestyleDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, lifestyleDescription: e.target.value }))}
              placeholder="추가 설명 (선택 사항)"
              className="input-field h-24"
              maxLength={200}
            />
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