'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClientSupabaseClient } from '@/utils/supabase';
import { getProfiles } from '../api/getProfiles';

// 대학별 학과 정보 타입 정의
type University = string;
type Department = string;
type DepartmentsByUniversity = Record<University, Department[]>;

interface OnboardingForm {
  name: string;
  university: string;
  department: string;
  studentId: string;
  grade: string;
  image: string;
  age: string;
  gender: string;
}

interface ValidationErrors {
  name: boolean;
  university: boolean;
  department: boolean;
  studentId: boolean;
  grade: boolean;
  image: boolean;
  age: boolean;
  gender: boolean;
}

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingForm>({
    name: '',
    university: '',
    department: '',
    studentId: '',
    grade: '',
    image: '',
    age: '',
    gender: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({
    name: false,
    university: false,
    department: false,
    studentId: false,
    grade: false,
    image: false,
    age: false,
    gender: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // 대학 선택 시 학과 변경 처리
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const universities = [
    '충남대학교',
    '한밭대학교',
    '대전대학교',
    '배재대학교',
    '우송대학교',
    '목원대학교',
    '한남대학교',
    '대전가톨릭대학교',
    '침례신학대학교',
    '한국과학기술원(KAIST)',
  ];

  const studentIds = Array.from({ length: 9 }, (_, i) => `${i + 17}학번`);
  const grades = Array.from({ length: 5 }, (_, i) => `${i + 1}학년`);

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
    ],
    '목원대학교': [
      '신학과', '국어국문학과', '영어영문학과', '경영학과', '사회복지학과',
      '컴퓨터공학과', '음악학과', '미술학과', '체육학과'
    ],
    '대전가톨릭대학교': [
      '신학과', '종교학과', '사회복지학과', '교육학과'
    ],
    '침례신학대학교': [
      '신학과', '기독교교육학과', '상담심리학과', '사회복지학과'
    ]
  };

  const [profiles, setProfiles] = useState<any[]>([]); // Profiles 타입 사용

  const fetchProfiles = async () => {
    const data = await getProfiles();
    if (data) {
      setProfiles(data);
    }
  };

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUni = e.target.value;
    setSelectedUniversity(selectedUni);
    setFormData({ ...formData, university: selectedUni, department: '' });
    setErrors({ ...errors, university: false });
    setDepartmentSearch('');
  };

  const filteredDepartments = selectedUniversity
    ? departmentsByUniversity[selectedUniversity]?.filter(dept =>
        dept.toLowerCase().includes(departmentSearch.toLowerCase())
      ) || []
    : [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, image: base64String });
        setErrors({ ...errors, image: false });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: !formData.name,
      university: !formData.university,
      department: !formData.department,
      studentId: !formData.studentId,
      grade: !formData.grade,
      image: !formData.image,
      age: !formData.age,
      gender: !formData.gender,
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
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
    
    if (!validateForm()) {
      showTemporaryModal('모든 항목을 입력해주세요!');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('사용자가 인증되지 않았습니다.');
        showTemporaryModal('사용자가 인증되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      console.log({ user });

      // 프로필 정보 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender
        })
        .eq('user_id', user.id); // user_id로 프로필을 찾기

      if (updateError) {
        console.error('프로필 업데이트 에러:', updateError);
        showTemporaryModal('프로필 업데이트 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 온보딩 데이터 저장
      const onboardingData = {
        ...formData,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('onboardingProfile', JSON.stringify(onboardingData));
      console.log('온보딩 데이터 저장됨:', onboardingData);
      
      // 프로필 페이지로 이동
      router.push('/profile');
    } catch (error) {
      console.error('프로필 업데이트 중 오류가 발생했습니다:', error);
      showTemporaryModal('프로필 업데이트 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-h2">온보딩</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 프로필 사진 */}
          <div className={`card space-y-4 ${errors.image ? 'border-2 border-red-500' : ''}`}>
            <h2 className="text-h2">프로필 사진</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                {formData.image ? (
                  <Image
                    src={formData.image}
                    alt="프로필 사진"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">필수</span>
                  </div>
                )}
              </div>
              <label className={`btn-secondary cursor-pointer ${formData.image ? 'bg-white text-gray-700 border-[#4A90E2] hover:border-[#4A90E2]' : ''}`}>
                사진 업로드
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
              </label>
            </div>
          </div>

          {/* 이름 */}
          <div className={`card space-y-4 ${errors.name ? 'border-2 border-red-500' : ''}`}>
            <h2 className="text-h2">이름</h2>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: false });
              }}
              placeholder="실명을 입력해주세요"
              className="input-field"
              required
            />
          </div>

          {/* 학교 정보 */}
          <div className={`card space-y-4 ${errors.university || errors.department || errors.studentId || errors.grade ? 'border-2 border-red-500' : ''}`}>
            <h2 className="text-h2">학교 정보</h2>
            <div className="space-y-4">
              <select
                value={formData.university}
                onChange={handleUniversityChange}
                className={`input-field ${formData.university ? 'border-[#4A90E2]' : ''}`}
                required
              >
                <option value="">대학교 선택 (필수)</option>
                {universities.map((univ) => (
                  <option key={univ} value={univ}>{univ}</option>
                ))}
              </select>

              {/* 학과 선택 */}
              {formData.university ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={departmentSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDepartmentSearch(value);
                      // 검색어가 변경되면 department 값도 업데이트
                      if (value === '') {
                        setFormData({ ...formData, department: '' });
                      } else if (departmentsByUniversity[formData.university].includes(value)) {
                        setFormData({ ...formData, department: value });
                      }
                    }}
                    onFocus={() => {
                      // 포커스를 받으면 department 값을 비워서 버튼 목록이 다시 보이도록 함
                      setFormData({ ...formData, department: '' });
                    }}
                    placeholder="학과 검색 (필수)"
                    className={`input-field ${formData.department ? 'border-[#4A90E2]' : ''}`}
                  />
                  {!formData.department && (
                    <div className="h-24 overflow-hidden">
                      {filteredDepartments.length > 0 ? (
                        <div className="grid grid-cols-4 gap-1 h-full overflow-y-auto p-1">
                          {filteredDepartments.map((dept: Department) => (
                            <div key={dept} className="flex items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setDepartmentSearch(dept);
                                  setFormData({ ...formData, department: dept });
                                  setErrors({ ...errors, department: false });
                                }}
                                className="w-full h-5 px-1 py-0 text-[10px] font-medium rounded-md transition-colors 
                                  bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#4A90E2]"
                              >
                                <span className="block truncate">{dept}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-gray-500 text-sm">검색 결과가 없습니다</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-1">대학교를 먼저 선택해주세요.</p>
              )}

              <select
                value={formData.studentId}
                onChange={(e) => {
                  setFormData({ ...formData, studentId: e.target.value });
                  setErrors({ ...errors, studentId: false });
                }}
                className={`input-field ${formData.studentId ? 'border-[#4A90E2]' : ''}`}
                required
              >
                <option value="">학번 선택 (필수)</option>
                {studentIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>

              <select
                value={formData.grade}
                onChange={(e) => {
                  setFormData({ ...formData, grade: e.target.value });
                  setErrors({ ...errors, grade: false });
                }}
                className={`input-field ${formData.grade ? 'border-[#4A90E2]' : ''}`}
                required
              >
                <option value="">학년 선택 (필수)</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 나이 */}
          <div className={`card space-y-4 ${errors.age ? 'border-2 border-red-500' : ''}`}>
            <h2 className="text-h2">나이</h2>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => {
                setFormData({ ...formData, age: e.target.value });
                setErrors({ ...errors, age: false });
              }}
              placeholder="나이를 입력해주세요"
              className="input-field"
              required
            />
          </div>

          {/* 성별 */}
          <div className={`card space-y-4 ${errors.gender ? 'border-2 border-red-500' : ''}`}>
            <h2 className="text-h2">성별</h2>
            <select
              value={formData.gender}
              onChange={(e) => {
                setFormData({ ...formData, gender: e.target.value });
                setErrors({ ...errors, gender: false });
              }}
              className="input-field"
              required
            >
              <option value="">선택해주세요</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>

          {/* 다음 버튼 */}
          <button type="submit" className="btn-primary w-full">
            업데이트하기
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