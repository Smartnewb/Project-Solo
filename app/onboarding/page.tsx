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
  instagramId: string;
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
  instagramId: boolean;
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
    instagramId: '',
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
    instagramId: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // 대학 선택 시 학과 변경 처리
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const universities = [
    '건양대학교',
    '대전대학교',
    '대전신학대학교',
    '목원대학교',
    '배재대학교',
    '우송대학교',
    '침례신학대학교',
    '한남대학교',
    '충남대학교',
    '한국과학기술원(KAIST)',
    '국립한밭대학교',
    '한국방송통신대학교 대전충남지역대학',
    '을지대학교',
    '대덕대학교',
    '대전과학기술대학교',
    '대전보건대학교',
    '우송정보대학',
    '한국폴리텍IV대학'
  ];

  const studentIds = ['25학번', '24학번', '23학번', '22학번', '21학번', '20학번', '19학번', '18학번', '17학번'];
  const grades = Array.from({ length: 5 }, (_, i) => `${i + 1}학년`);

  // 대학별 학과 정보
  const departmentsByUniversity: DepartmentsByUniversity = {
    '건양대학교': [
      '의학과', '간호학과', '작업치료학과', '병원경영학과', '안경광학과', '임상병리학과',
      '방사선학과', '치위생학과', '물리치료학과', '응급구조학과', '의공학과', '의료IT공학과',
      '의료공간디자인학과', '의료신소재학과', '제약생명공학과', '인공지능학과', '스마트보안학과',
      '기업소프트웨어학부', '심리상담치료학과', '사회복지학과', '아동교육학과', '유아교육과',
      '특수교육과', '초등특수교육과', '중등특수교육과', '재활퍼스널트레이닝학과', '디지털콘텐츠학과',
      '시각디자인학과', '스포츠의학과', '경영학부', '금융세무학부', '호텔관광학과', '글로벌경영학과',
      '마케팅비즈니스학과', '금융학과', '세무학과', '국방경찰행정학부', '군사학과', '융합디자인학과',
      '임상의약학과', '의약바이오학과', '글로벌의료뷰티학과', '재난안전소방학과', '반도체공학과',
      '융합IT학과', '글로벌프론티어학과'
    ],
    '대전대학교': [
      '패션디자인비즈니스학과', '뷰티디자인학과', '커뮤니케이션디자인학과', '서예디자인학과',
      '웹툰애니메이션학과', '공연예술영상콘텐츠학과', '군사학과', '법학전공', '행정학전공',
      '사회복지학과', '상담학과', '중등특수교육과', '경영학부', '회계학전공', '비즈니스영어학과',
      '비즈니스중국어학과', '비즈니스일본어학과', '러시아언어문화전공', '물류통상학과',
      '산업광고심리학과', '건축공학과', '토목환경공학과', '반도체공학과', '재난안전공학과',
      '소방방재학과', 'IT소프트웨어공학과', '에너지신소재공학과', '간호학과', '물리치료학과',
      '임상병리학과', '응급구조학과', '식품영양학과', '스포츠운동과학과', '스포츠건강재활학과',
      '보건의료경영학과', '화장품학과', '디지털헬스케어학과', '컴퓨터공학과', '정보통신공학과',
      'AI소프트웨어학부', '빅데이터분석전공', '스마트모빌리티전공', '디지털금융(핀테크)전공',
      '인공지능전공', '정보보안학과', 'AI융합학과', '핀테크학과', '빅데이터인공지능학과'
    ],
    '대전신학대학교': ['신학과'],
    '목원대학교': [
      '국어국문학과', '영어영문학과', '수학과', '물리학과', '건축학부', '도시공학과',
      '컴퓨터공학과', '전기전자공학과', '정보통신공학과', '로봇학과', '도시환경화학공학과',
      '음악학과', '미술학과', '사회복지학과'
    ],
    '배재대학교': [
      '국어국문한국어교육학과', '일본학과', '경찰법학부 경찰학전공', '경찰법학부 법학전공',
      '행정학과', '심리상담학과', '유아교육과', '경영학과', 'IT경영정보학과', '글로벌비즈니스학과',
      '관광경영학과', '호텔항공경영학과', '항공서비스학과', '생명공학과', '식품영양학과',
      '외식조리학과', '원예산림학과', '보건의료복지학과', '간호학과', '전자전기공학과',
      '스마트배터리학과', '드론로봇공학과', '철도건설공학과', '소프트웨어공학부 컴퓨터공학',
      '소프트웨어공학부 소프트웨어학', '소프트웨어공학부 정보보안학', '소프트웨어공학부 게임공학',
      '건축학과', '실내건축학과', '조경학과'
    ],
    '우송대학교': [
      '전자공학과', '컴퓨터과학과', '건축공학과', '토목환경공학과', '식품과학과',
      '컴퓨터디자인학과', '관광경영학과', '국제통상학과', '경영학부', '글로벌조리학부',
      '글로벌호텔매니지먼트학과', '글로벌의료서비스경영학과', '철도경영학과', '물류시스템학과',
      '철도전기시스템학과', '철도차량시스템학과', '창의소프트웨어전공', '데이타사이언스전공',
      '사회복지학과', '글로벌아동교육학과', '작업치료학과', '언어치료·청각재활학과',
      '보건의료경영학과', '유아교육과', '뷰티디자인경영학과', '응급구조학과', '소방안전학부',
      '간호학과', '물리치료학과', '스포츠건강재활학과'
    ],
    '침례신학대학교': [
      '신학과', '기독교교육학과', '청소년학과', '교회음악과', '사회복지학과',
      '유아교육과', '상담심리학과', '실용영어학과', '융합실용 기악과'
    ],
    '한남대학교': [
      '국어국문·창작학과', '영어영문학과', '응용영어콘텐츠학과', '일어일문학전공',
      '프랑스어문학전공', '문헌정보학과', '사학과', '기독교학과'
    ],
    '충남대학교': [
      '국어국문학과', '영어영문학과', '수학과', '물리학과', '화학과', '생물학과',
      '컴퓨터공학과', '전기공학과', '전자공학과', '정보통신공학과', '기계공학과',
      '건축공학과', '화학공학과', '신소재공학과', '경영학과', '경제학과', '행정학과'
    ],
    '한국과학기술원(KAIST)': [
      '물리학과', '화학과', '기계공학과', '전기전자공학과', '컴퓨터과학과',
      '전산학부', '생명과학과', '바이오시스템학과', '경영학부'
    ],
    '국립한밭대학교': [
      '국어국문학과', '영어영문학과', '수학과', '물리학과', '컴퓨터공학과',
      '전기전자공학과', '정보통신공학과', '음악학과', '미술학과', '간호학과',
      '물리치료학과', '산업경영학과', '산업디자인학과'
    ],
    '한국방송통신대학교 대전충남지역대학': [],
    '을지대학교': [
      '국어국문학과', '영어영문학과', '수학과', '물리학과', '컴퓨터공학과',
      '전기전자공학과', '정보통신공학과', '음악학과', '미술학과', '간호학과',
      '물리치료학과', '임상병리학과', '응급구조학과'
    ],
    '대덕대학교': [
      '국어국문학과', '영어영문학과', '수학과', '물리학과', '컴퓨터공학과',
      '전기전자공학과', '정보통신공학과', '음악학과', '미술학과'
    ],
    '대전과학기술대학교': [
      '국어국문학과', '영어영문학과', '수학과', '물리학과', '컴퓨터공학과',
      '전기전자공학과', '정보통신공학과', '음악학과', '미술학과'
    ],
    '대전보건대학교': ['간호학과', '물리치료학과', '사회복지학과'],
    '우송정보대학': ['컴퓨터공학과', '정보통신공학과', '경영학과', '경제학과'],
    '한국폴리텍IV대학': ['기계공학과', '전자공학과', '컴퓨터공학과', '정보통신공학과']
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
      name: !formData.name.trim(),
      university: !formData.university,
      department: !formData.department,
      studentId: !formData.studentId,
      grade: !formData.grade,
      image: !formData.image,
      age: !formData.age,
      gender: !formData.gender,
      instagramId: !formData.instagramId.trim(),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error);
    if (hasErrors) {
      setShowModal(true);
    }
    return !hasErrors;
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
          gender: formData.gender,
          student_id: formData.studentId,
          grade: formData.grade,
          university: formData.university,
          department: formData.department
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-h2">온보딩</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 입력 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.name ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">이름</h2>
              {errors.name && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: false });
              }}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-300 focus:outline-none transition-all"
              placeholder="이름을 입력하세요"
            />
          </div>

          {/* 대학교 선택 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.university ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">대학교</h2>
              {errors.university && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <select
              value={formData.university}
              onChange={handleUniversityChange}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-300 focus:outline-none transition-all"
            >
              <option value="">대학교를 선택하세요</option>
              {universities.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>

          {/* 학과 선택 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.department ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">학과</h2>
              {errors.department && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <input
              type="text"
              value={departmentSearch}
              onChange={(e) => setDepartmentSearch(e.target.value)}
              placeholder="학과 검색"
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-300 focus:outline-none transition-all mb-2"
            />
            <div className="grid grid-cols-2 gap-2">
              {filteredDepartments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, department: dept });
                    setErrors({ ...errors, department: false });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.department === dept
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* 학번 선택 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.studentId ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">학번</h2>
              {errors.studentId && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {studentIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, studentId: id });
                    setErrors({ ...errors, studentId: false });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.studentId === id
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* 학년 선택 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.grade ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">학년</h2>
              {errors.grade && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {grades.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, grade: grade });
                    setErrors({ ...errors, grade: false });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.grade === grade
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* 프로필 사진 업로드 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.image ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">프로필 사진</h2>
              {errors.image && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            {formData.image && (
              <div className="mt-4">
                <Image
                  src={formData.image}
                  alt="프로필 사진"
                  width={200}
                  height={200}
                  className="rounded-xl"
                />
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              자신을 잘 들어내는 사진을 넣어주세요. 어차피 인스타그램에 사진 있으니까 뭘 넣어도 상관은 없습니다. 
              사진은 매칭 상대에게만 보여집니다.
            </p>
          </div>

          {/* 나이 입력 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.age ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">나이</h2>
              {errors.age && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => {
                setFormData({ ...formData, age: e.target.value });
                setErrors({ ...errors, age: false });
              }}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-300 focus:outline-none transition-all"
              placeholder="나이를 입력하세요"
              min="18"
              max="29"
            />
          </div>

          {/* 성별 선택 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.gender ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">성별</h2>
              {errors.gender && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['남성', '여성'].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, gender });
                    setErrors({ ...errors, gender: false });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${formData.gender === gender
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* 인스타그램 아이디 입력 */}
          <div className={`bg-white rounded-2xl shadow-sm p-6 space-y-4 ${errors.instagramId ? 'ring-2 ring-red-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">인스타그램 아이디</h2>
              {errors.instagramId && (
                <span className="text-sm text-red-500">필수 입력 항목입니다</span>
              )}
            </div>
            <input
              type="text"
              value={formData.instagramId}
              onChange={(e) => {
                setFormData({ ...formData, instagramId: e.target.value });
                setErrors({ ...errors, instagramId: false });
              }}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-300 focus:outline-none transition-all"
              placeholder="인스타그램 아이디를 입력하세요"
            />
            <div className="space-y-2 mt-2">
              <p className="text-sm text-gray-600">
                인스타그램 계정을 공개로 설정하고, 사진을 업로드하면 매칭 확률이 높아집니다!
              </p>
              <p className="text-sm text-gray-600">
                매칭된 상대와 더 자연스러운 대화를 시작할 수 있어요.
              </p>
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-sm hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
          >
            저장하기
          </button>
        </form>
      </div>

      {/* 에러 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              필수 입력 항목을 확인해주세요
            </h3>
            <div className="space-y-2 mb-6">
              {errors.name && (
                <p className="text-red-500">• 이름을 입력해주세요</p>
              )}
              {errors.university && (
                <p className="text-red-500">• 대학교를 선택해주세요</p>
              )}
              {errors.department && (
                <p className="text-red-500">• 학과를 선택해주세요</p>
              )}
              {errors.studentId && (
                <p className="text-red-500">• 학번을 선택해주세요</p>
              )}
              {errors.grade && (
                <p className="text-red-500">• 학년을 선택해주세요</p>
              )}
              {errors.image && (
                <p className="text-red-500">• 프로필 사진을 업로드해주세요</p>
              )}
              {errors.age && (
                <p className="text-red-500">• 나이를 입력해주세요</p>
              )}
              {errors.gender && (
                <p className="text-red-500">• 성별을 선택해주세요</p>
              )}
              {errors.instagramId && (
                <p className="text-red-500">• 인스타그램 아이디를 입력해주세요</p>
              )}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}