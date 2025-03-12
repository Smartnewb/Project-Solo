'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// 대학별 학과 정보 타입 정의
type University = string;
type Department = string;
type DepartmentsByUniversity = Record<University, Department[]>;

export default function ProfilePage() {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('');
  const [mbti, setMbti] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [drinking, setDrinking] = useState('');
  const [smoking, setSmoking] = useState('');
  const [tattoo, setTattoo] = useState('');
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [datingStyles, setDatingStyles] = useState<string[]>([]);
  const [lifestyles, setLifestyles] = useState<string[]>([]);
  
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (profile) {
      setNickname(profile.nickname || '');
      setBio(profile.bio || '');
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || 'male');
      setHeight(profile.height || '');
      setMbti(profile.mbti || '');
      setInterests(profile.interests || []);
      setDrinking(profile.drinking || '');
      setSmoking(profile.smoking || '');
      setTattoo(profile.tattoo || '');
      setPersonalities(profile.personalities || []);
      setDatingStyles(profile.datingStyles || []);
      setLifestyles(profile.lifestyles || []);
    }
  }, [user, profile, router]);

  const interestOptions = [
    '영화', '음악', '독서', '게임', '운동', 
    '요리', '여행', '사진', '패션', '카페',
    '공연', '전시', '반려동물', '등산', '자전거'
  ];

  const heightOptions = [
    '~155cm', '156~160cm', '161~165cm', '166~170cm',
    '171~175cm', '176~180cm', '181~185cm', '186cm~'
  ];

  const mbtiTypes = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
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
    '즉흥적인 스타일',
  ];

  const datingStyleOptions = [
    '적극적인 스타일',
    '다정다감한 스타일',
    '친구처럼 지내는 스타일',
    '츤데레 스타일',
    '표현을 잘 안 하지만 속은 다정한 스타일',
    '자유로운 연애를 선호하는 스타일',
  ];

  const lifestyleOptions = [
    '아침형 인간',
    '밤형 인간',
    '집순이 / 집돌이',
    '여행을 자주 다니는 편',
    '운동을 즐기는 편',
    '게임을 자주 하는 편',
    '카페에서 노는 걸 좋아함',
    '액티비티 활동을 좋아함',
  ];

  const drinkingOptions = [
    '자주 마시는 편',
    '가끔 마시는 편',
    '거의 안 마시는 편',
    '전혀 마시지 않음',
  ];

  const smokingOptions = [
    '네, 흡연자입니다',
    '금연 중입니다',
    '비흡연자입니다',
  ];

  const tattooOptions = [
    '네, 있습니다',
    '작은 문신이 있습니다',
    '없습니다',
  ];

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handlePersonalityToggle = (personality: string) => {
    setPersonalities(prev => 
      prev.includes(personality)
        ? prev.filter(p => p !== personality)
        : prev.length < 3 ? [...prev, personality] : prev
    );
  };

  const handleDatingStyleToggle = (style: string) => {
    setDatingStyles(prev => 
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : prev.length < 2 ? [...prev, style] : prev
    );
  };

  const handleLifestyleToggle = (lifestyle: string) => {
    setLifestyles(prev => 
      prev.includes(lifestyle)
        ? prev.filter(l => l !== lifestyle)
        : prev.length < 3 ? [...prev, lifestyle] : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    if (!nickname || !university || !major || !height || !mbti) {
      setError('모든 필수 항목을 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await updateProfile({
        nickname,
        bio,
        university,
        major,
        age: parseInt(age),
        gender,
        height,
        mbti,
        interests,
        personalities,
        datingStyles,
        lifestyles,
        drinking,
        smoking,
        tattoo
      });

      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setError('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
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

  // 전공 검색 기능 수정
  const [selectedUniversity, setSelectedUniversity] = useState<University>('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUniversity(e.target.value);
    setMajor('');
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
    <div className="min-h-screen bg-[#F6F8FF]">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold flex-1 text-center text-gray-900">프로필 설정</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 닉네임 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">닉네임 *</h2>
            <input
              id="nickname"
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2] focus:ring-opacity-20 transition-colors"
              placeholder="닉네임을 입력하세요"
            />
          </div>

          {/* 대학교 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">대학교 *</h2>
            <select
              value={selectedUniversity}
              onChange={handleUniversityChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2] focus:ring-opacity-20 transition-colors"
            >
              <option value="">대학교 선택</option>
              {universityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* 학과 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">학과 *</h2>
            {selectedUniversity ? (
              <>
                <input
                  type="text"
                  value={departmentSearch}
                  onChange={(e) => setDepartmentSearch(e.target.value)}
                  placeholder="학과 검색"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2] focus:ring-opacity-20 transition-colors mb-4"
                />
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {filteredDepartments.map((dept: Department) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setMajor(dept)}
                      className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                        major === dept
                          ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">대학교를 먼저 선택해주세요.</p>
            )}
          </div>

          {/* 키 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">키 *</h2>
            <div className="grid grid-cols-2 gap-2">
              {heightOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setHeight(option)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    height === option
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* MBTI */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">MBTI *</h2>
            <div className="grid grid-cols-4 gap-2">
              {mbtiTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMbti(type)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    mbti === type
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 자기소개 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">자기소개</h2>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2] focus:ring-opacity-20 transition-colors"
              placeholder="자신을 소개해주세요"
            />
          </div>

          {/* 관심사 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">관심사 (최대 5개)</h2>
            <div className="grid grid-cols-3 gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  disabled={!interests.includes(interest) && interests.length >= 5}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    interests.includes(interest)
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : interests.length >= 5
                      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* 성격 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">성격 (최대 3개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {personalityOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handlePersonalityToggle(option)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    personalities.includes(option)
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : personalities.length >= 3
                      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 연애 스타일 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">연애 스타일 (최대 2개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {datingStyleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleDatingStyleToggle(option)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    datingStyles.includes(option)
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : datingStyles.length >= 2
                      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 라이프스타일 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">라이프스타일 (최대 3개)</h2>
            <div className="grid grid-cols-2 gap-2">
              {lifestyleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleLifestyleToggle(option)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    lifestyles.includes(option)
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : lifestyles.length >= 3
                      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 음주 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">음주</h2>
            <div className="grid grid-cols-2 gap-2">
              {drinkingOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDrinking(option)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    drinking === option
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 흡연 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">흡연</h2>
            <div className="grid grid-cols-2 gap-2">
              {smokingOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSmoking(option)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    smoking === option
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 문신 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">문신</h2>
            <div className="grid grid-cols-2 gap-2">
              {tattooOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTattoo(option)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    tattoo === option
                      ? 'bg-[#4A90E2] text-white border-2 border-[#4A90E2]'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4A90E2]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800">
                프로필이 성공적으로 업데이트되었습니다.
              </p>
            </div>
          )}

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 text-sm font-medium text-white bg-[#4A90E2] rounded-xl hover:bg-[#357ABD] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:ring-opacity-50 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </div>
    </div>
  );
} 