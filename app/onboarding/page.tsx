'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClientSupabaseClient } from '@/utils/supabase';
import { getProfiles } from '../api/getProfiles';

// 대학별 학과 정보 타입 정의
type University = string;
type Department = string;
type DepartmentsByUniversity = Record<University, Department[]>;

interface OnboardingForm {
  university: string;
  department: string;
  studentId: string;
  grade: string;
  image: string;
  instagramId: string;
}

interface ValidationErrors {
  university: boolean;
  department: boolean;
  studentId: boolean;
  grade: boolean;
  image: boolean;
  instagramId: boolean;
}

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingForm>({
    university: '',
    department: '',
    studentId: '',
    grade: '',
    image: '',
    instagramId: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({
    university: false,
    department: false,
    studentId: false,
    grade: false,
    image: false,
    instagramId: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // 대학 선택 시 학과 변경 처리
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);

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
      '융합디자인학과', '임상의약학과', '의약바이오학과', '글로벌의료뷰티학과', '재난안전소방학과',
      '반도체공학과', 'K-문화산업학과', '드론기계학과', '융합IT학과', '글로벌프론티어학과',
      '의학과', '간호학과', '작업치료학과', '병원경영학과', '안경광학과', '임상병리학과',
      '방사선학과', '치위생학과', '물리치료학과', '응급구조학과', '의공학과', '의료IT공학과',
      '의료공간디자인학과', '의료신소재학과', '제약생명공학과', '인공지능학과', '스마트보안학과',
      '기업소프트웨어학부', '심리상담치료학과', '사회복지학과', '아동교육학과', '유아교육과',
      '특수교육과', '초등특수교육과', '중등특수교육과', '재활퍼스널트레이닝학과', '디지털콘텐츠학과',
      '시각디자인학과', '스포츠의학과', '경영학부', '금융세무학부', '호텔관광학과', '글로벌경영학과',
      '마케팅비즈니스학과', '금융학과', '세무학과', '국방경찰행정학부', '군사학과'
    ],
    '대전대학교': [
      '글로벌문화콘텐츠학전공', '국어국문창작학전공', '역사문화학전공', '영미언어문화학전공',
      '경제학전공', '생명과학전공', 'PPE(정치·경제·철학)전공', 'MCS(수학·컴퓨터과학)전공',
      '학생설계전공', '건축학과', '패션디자인·비즈니스학과', '뷰티디자인학과', '커뮤니케이션디자인학과',
      '웹툰애니메이션학과', '공연예술영상콘텐츠학과', '군사학과', '경찰학과', '법학전공',
      '행정학전공', '사회복지학과', '상담학과', '중등특수교육과', '경영학전공', '회계학전공',
      '비즈니스영어학과', '비즈니스일본어학과', '물류통상학과', '산업·광고심리학과', '건축공학과',
      '토목환경공학과', '재난안전공학과', '소방방재학과', '반도체공학과', '컴퓨터공학과',
      '정보통신공학과', '정보보안학과', 'AI소프트웨어학부', '간호학과', '물리치료학과',
      '임상병리학과', '응급구조학과', '식품영양학과', '스포츠운동과학과', '스포츠건강재활학과',
      '보건의료경영학과', '화장품학과', '디지털헬스케어학과', '한의학과'
    ],
    '대전신학대학교': ['신학과'],
    '목원대학교': [
      '건축학부', '도시공학과', '컴퓨터공학과', '전기전자공학과', '정보통신공학과', '로봇학과', '도시환경화학공학과',
      '항공호텔관광경영학과', '부동산금융보험학과', '금융경제학과', '마케팅빅데이터학과', '중국문화·비즈니스학과',
      '경찰법학과', '경영학부', '광고홍보커뮤니케이션학부', '경찰행정학부'
    ],
    '배재대학교': [
      '국어국문한국어교육학과', '일본학과', '경찰법학부', '행정학과', '심리상담학과',
      '유아교육과', '기독교사회복지학과', '경영학과', 'IT경영정보학과', '글로벌비즈니스학과',
      '관광경영학과', '호텔항공경영학과', '항공서비스학과', '생명공학과', '식품영양학과',
      '외식조리학과', '원예산림학과', '보건의료복지학과', '간호학과', '전기전자공학과',
      '스마트배터리학과', '드론로봇공학과', '철도건설공학과', '소프트웨어공학부', '건축학과',
      '실내건축학과', '조경학과', '아트앤웹툰학부', '디자인학부', '광고사진영상학과',
      '미디어콘텐츠학과', '의류패션학과', '뷰티케어학과', '공연예술학과', '레저스포츠학부'
    ],
    '우송대학교': [
      '솔브릿지경영학부', '융합경영학부', '자유전공학부', 'AI·빅데이터학과', '글로벌호텔매니지먼트학과',
      '철도건설시스템학부', '철도경영학과', '물류시스템학과', '철도시스템학부', '철도차량시스템학과',
      '테크노미디어융합학부', '소프트웨어학부', 'IT융합학부', '글로벌조리학부', '외식조리학부',
      '외식조리영양학과', '호텔관광경영학과', '사회복지학과', '작업치료학과', '언어치료·청각재활학과',
      '보건의료경영학과', '유아교육과', '뷰티디자인경영학과', '응급구조학과', '소방·안전학부', '간호학과',
      '물리치료학과', '스포츠건강재활학과', '동물의료관리학과', '휴먼디지털인터페이스학부'
    ],
    '침례신학대학교': [
      '신학과', '기독교교육학과', '청소년학과', '상담심리학과', '실용영어학과',
      '사회복지학과', '유아교육과', '교회음악과', '융합실용기악과'
    ],
    '한남대학교': [
      // 문과대학
      '국어국문·창작학과', '영어영문학과', '응용영어콘텐츠학과', '일어일문학전공', '프랑스어문학전공',
      '문헌정보학과', '사학과', '기독교학과',
      // 사범대학
      '국어교육과', '영어교육과', '교육학과', '역사교육과', '미술교육과', '수학교육과',
      // 공과대학
      '정보통신공학과', '전기전자공학과', '멀티미디어공학과', '건축학과(5년제)', 
      '건축공학전공', '토목환경공학전공', '기계공학과', '화학공학과', '신소재공학과', '컴퓨터통신무인기술학과',
      // 스마트융합대학
      '컴퓨터공학과', '산업경영공학과', 'AI융합학과', '수학과', '빅데이터응용학과',
      // 경상대학
      '경영학과', '회계학과', '무역물류학과', '경제학과', '중국경제통상학과', '호텔항공경영학과', '경영정보학과',
      // 사회과학대학
      '법학전공', '법무법학전공', '행정학과', '경찰학과', '정치·언론학과', '사회복지학과',
      '아동복지학과', '상담심리학과', '사회적경제기업학과',
      // 생명·나노과학대학
      '생명시스템과학과', '식품영양학과', '화학과', '간호학과', '스포츠과학과', '바이오제약공학과',
      // 린튼글로벌스쿨
      '글로벌비즈니스전공', '글로벌미디어·컬처전공',
      // 아트&디자인테크놀로지대학
      '융합디자인학과', '회화과', '패션디자인학과', '미디어영상학과',
      // 기타
      '자유전공학부'
    ],
    '충남대학교': [
      '국어국문학과', '영어영문학과', '수학과', '물리학과', '화학과', '생물학과',
      '컴퓨터공학과', '전기공학과', '전자공학과', '정보통신공학과', '기계공학과',
      '건축공학과', '화학공학과', '신소재공학과', '경영학과', '경제학과', '행정학과'
    ],
    '한국과학기술원(KAIST)': [
      '물리학과', '수리과학과', '화학과', '생명과학과', '기계공학과', '항공우주공학과', '전기및전자공학부',
      '미래자동차학제전공', '전산학부', '건설및환경공학과', '산업및시스템공학과', '지식서비스공학대학원',
      '생명화학공학과', '신소재공학과', '원자력및양자공학과', '문화기술대학원', '기술경영학부',
      '조천식녹색교통대학원', 'AI대학원', '바이오및뇌공학과', '산업디자인학과', '융합인재학부',
      '로봇공학 학제전공', '반도체 학제전공'
    ],
    '국립한밭대학교': [
      '모바일융합공학과', '반도체시스템공학과', '응용소프트웨어학과', '인공지능소프트웨어공학과', '전기공학과',
      '전기시스템공학과', '전자공학과', '정보통신공학과', '지능미디어공학과', '컴퓨터공학과',
      '건설환경공학과', '건축공학과', '건축학과(5년제)', '도시공학과', '산업디자인학과', '생활디자인학과',
      '시각·영상디자인학과', '융합건설시스템학과', '통합물관리학과', '공공행정학과', '영어영문학과',
      '일본어과', '중국어과', '스포츠건강과학과', '창업경영학과', '회계세무부동산학과', '산업경영공학과',
      '화학생명공학과', '창의융합학과', '경제학과', '융합경영학과'
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
    '우송정보대학': [
      '글로벌명품조리과', '글로벌제과제빵과', '글로벌호텔외식산업과', '글로벌실용음악과',
      '외식조리과', '제과제빵학부', '조리부사관과', '식품영양조리학부', '호텔관광과',
      '호텔서비스사관과', '뷰티디자인학부', '디자인·영상콘텐츠학부', '애완동물학부',
      '기계자동차설비학부', '기계전자자동화과', '전자정보과', '컴퓨터정보과', '간호과'
    ],
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

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDepartmentSearch(value);
    setCustomDepartment(value);
    setIsCustomDepartment(true);
  };

  const handleDepartmentSelect = (dept: string) => {
    setFormData({ ...formData, department: dept });
    setErrors({ ...errors, department: false });
    setIsCustomDepartment(false);
    setDepartmentSearch(dept);
  };

  const handleCustomDepartmentSubmit = async () => {
    if (!customDepartment.trim() || !formData.university) return;

    // 1. 먼저 현재 입력된 학과를 프로필에 저장
    setFormData({ ...formData, department: customDepartment });
    setErrors({ ...errors, department: false });

    try {
      // 2. custom_departments 테이블에서 해당 대학-학과 조합의 카운트를 가져오거나 생성
      const { data: existingData, error: fetchError } = await supabase
        .from('custom_departments')
        .select('count')
        .eq('university', formData.university)
        .eq('department_name', customDepartment)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116는 데이터가 없는 경우
        console.error('학과 조회 중 오류 발생:', fetchError);
        return;
      }

      if (existingData) {
        // 이미 존재하는 경우 카운트 증가
        const { error: updateError } = await supabase
          .from('custom_departments')
          .update({ count: existingData.count + 1 })
          .eq('university', formData.university)
          .eq('department_name', customDepartment);

        if (updateError) {
          console.error('학과 카운트 업데이트 중 오류 발생:', updateError);
        }

        // 카운트가 3 이상이면 공식 학과 목록에 추가
        if (existingData.count + 1 >= 3) {
          const updatedDepartments = [...(departmentsByUniversity[formData.university] || [])];
          if (!updatedDepartments.includes(customDepartment)) {
            updatedDepartments.push(customDepartment);
            departmentsByUniversity[formData.university] = updatedDepartments;
          }
        }
      } else {
        // 새로운 학과 추가
        const { error: insertError } = await supabase
          .from('custom_departments')
          .insert({
            university: formData.university,
            department_name: customDepartment,
            count: 1
          });

        if (insertError) {
          console.error('새로운 학과 추가 중 오류 발생:', insertError);
        }
      }
    } catch (error) {
      console.error('학과 처리 중 오류 발생:', error);
    }
  };

  const filteredDepartments = selectedUniversity
    ? departmentsByUniversity[selectedUniversity]?.filter(dept =>
        dept.toLowerCase().includes(departmentSearch.toLowerCase())
      ) || []
    : [];

  // 이미지 크기 줄이기 함수
  const compressImage = (base64String: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // 비율 계산
        const ratio = maxWidth / img.width;
        const width = maxWidth;
        const height = img.height * ratio;

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // 압축된 이미지 반환
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // 이미지 압축
        const compressedImage = await compressImage(base64String);
        setFormData({ ...formData, image: compressedImage });
        setErrors({ ...errors, image: false });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    console.log('폼 데이터 검증 시작:', formData);

    const newErrors = {
      university: !formData.university?.trim(),
      department: !formData.department?.trim(),
      studentId: !formData.studentId?.trim(),
      grade: !formData.grade?.trim(),
      image: !formData.image,
      instagramId: !formData.instagramId?.trim()
    };

    Object.entries(newErrors).forEach(([field, hasError]) => {
      console.log(`${field} 검증 결과:`, {
        값: formData[field as keyof OnboardingForm],
        오류여부: hasError
      });
    });

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error);
    if (hasErrors) {
      console.log('폼 검증 실패. 오류 항목:', 
        Object.entries(newErrors)
          .filter(([_, hasError]) => hasError)
          .map(([field]) => field)
      );
      setShowModal(true);
    } else {
      console.log('폼 검증 성공');
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
    
    console.log('폼 제출 시작');
    console.log('제출된 폼 데이터:', formData);
    
    if (!validateForm()) {
      console.log('폼 검증 실패로 제출 중단');
      return;
    }

    try {
      // 1. 사용자 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('세션 확인 오류:', sessionError);
        showTemporaryModal('인증 상태를 확인할 수 없습니다. 다시 로그인해주세요.');
        router.push('/');
        return;
      }

      // 2. 사용자 메타데이터에서 이름 가져오기
      const userName = session.user.user_metadata?.name || '사용자';

      // 3. 프로필 데이터 준비
      const profileData = {
        user_id: session.user.id,
        name: userName,
        student_id: formData.studentId.trim(),
        grade: formData.grade.trim(),
        university: formData.university.trim(),
        department: formData.department.trim(),
        instagram_id: formData.instagramId.trim(),
        avatar_url: formData.image,
        updated_at: new Date().toISOString()
      };

      console.log('저장할 프로필 데이터:', profileData);

      // 4. 프로필 저장
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('프로필 저장 오류:', upsertError);
        showTemporaryModal('프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      console.log('프로필 저장 성공');
      
      // 저장 성공 메시지 표시
      showTemporaryModal('프로필이 성공적으로 저장되었습니다!');

      // 잠시 대기 후 홈페이지로 이동
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    } catch (err) {
      console.error('프로필 저장 중 예외 발생:', err);
      showTemporaryModal('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('온보딩 페이지: 인증 상태 확인 중...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('세션 확인 오류:', sessionError);
          router.push('/');
          return;
        }

        if (!session) {
          console.log('로그인이 필요합니다.');
          router.push('/');
          return;
        }

        console.log('세션 유저 ID:', session.user.id);

        // 이미 프로필이 있는지 확인
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              console.log('프로필이 없습니다. 온보딩을 계속합니다.');
              setIsLoading(false);
            } else {
              console.error('프로필 조회 중 오류 발생:', profileError);
              setIsLoading(false);
            }
          } else if (profile) {
            console.log('이미 프로필이 존재합니다. 홈으로 이동합니다.', profile);
            router.push('/home');
          } else {
            // 프로필이 없는 경우 온보딩 페이지에 머무름
            console.log('온보딩을 시작합니다.');
            setIsLoading(false);
          }
        } catch (err) {
          console.error('프로필 확인 중 예외 발생:', err);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('인증 확인 중 오류 발생:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-h2">온보딩</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="space-y-4">
              <input
                type="text"
                value={departmentSearch}
                onChange={handleDepartmentChange}
                placeholder="학과 검색 또는 직접 입력"
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-300 focus:outline-none transition-all"
              />
              {isCustomDepartment && departmentSearch.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    handleCustomDepartmentSubmit();
                  }}
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium transition-all bg-purple-50 text-purple-700 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-100"
                >
                  "{departmentSearch}" 직접 입력하기
                </button>
              )}
              {filteredDepartments.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {filteredDepartments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleDepartmentSelect(dept)}
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
              )}
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
                <img
                  src={formData.image}
                  alt="프로필 사진"
                  style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                  className="rounded-xl"
                />
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              자신을 잘 들어내는 사진을 넣어주세요. 어차피 인스타그램에 사진 있으니까 뭘 넣어도 상관은 없습니다. 
              사진은 매칭 상대에게만 보여집니다.
            </p>
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