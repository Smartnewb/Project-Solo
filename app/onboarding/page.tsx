'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClientSupabaseClient } from '@/utils/supabase';
import { getProfiles } from '../api/getProfiles';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, profile, hasCompletedOnboarding, loading: authLoading, updateProfile: updateAuthProfile } = useAuth();
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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
    console.log('폼 데이터 검증 시작, 전체 폼 데이터:', formData);

    // 데이터 존재 확인 전 trim 처리
    const universityValue = formData.university?.trim() || '';
    const departmentValue = formData.department?.trim() || '';
    const studentIdValue = formData.studentId?.trim() || '';
    const gradeValue = formData.grade?.trim() || '';
    const instagramIdValue = formData.instagramId?.trim() || '';
    
    console.log('검증 전 데이터 점검:', {
      university: universityValue.length > 0 ? '있음' : '없음',
      department: departmentValue.length > 0 ? '있음' : '없음',
      studentId: studentIdValue.length > 0 ? '있음' : '없음',
      grade: gradeValue.length > 0 ? '있음' : '없음',
      image: formData.image ? '있음' : '없음',
      instagramId: instagramIdValue.length > 0 ? '있음' : '없음'
    });

    const newErrors = {
      university: !universityValue,
      department: !departmentValue,
      studentId: !studentIdValue,
      grade: !gradeValue,
      image: !formData.image,
      instagramId: !instagramIdValue
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
      console.log('폼 검증 성공, 모든 필드 검증 통과');
    }

    return !hasErrors;
  };

  const showTemporaryModal = (message: string) => {
    setModalMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('폼 제출 시작');
    console.log('제출된 폼 데이터:', formData);
    
    // 모든 폼 데이터 로깅 (디버깅)
    Object.entries(formData).forEach(([field, value]) => {
      console.log(`${field}: ${value ? '입력됨' : '입력되지 않음'}, 값:`, value);
    });
    
    if (!validateForm()) {
      console.log('폼 검증 실패로 제출 중단');
      return;
    }

    try {
      if (!user) {
        console.error('인증된 사용자가 없습니다.');
        showTemporaryModal('인증 상태를 확인할 수 없습니다. 다시 로그인해주세요.');
        router.push('/');
        return;
      }

      // 직접 Supabase 클라이언트를 사용하여 프로필 저장 시도
      const supabaseClient = createClientSupabaseClient();
      
      // 먼저 세션 검증
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session) {
        console.error('유효한 세션이 없습니다.');
        showTemporaryModal('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
        return;
      }
      
      console.log('인증된 세션 확인:', !!session);
      console.log('사용자 ID:', user.id);
      
      // 기존 프로필이 있는지 확인
      console.log('기존 프로필 확인 중...');
      const { data: existingProfile, error: checkError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('프로필 확인 중 오류:', checkError);
      } else {
        console.log('기존 프로필 확인 결과:', existingProfile ? '있음' : '없음');
      }
      
      // 프로필 기본 데이터 준비
      const profileData = {
        user_id: user.id,
        name: user.user_metadata?.name || '사용자',
        updated_at: new Date().toISOString()
      };
      
      // 저장 시도
      console.log('프로필 저장 시도... (기본 필드)');
      console.log('저장할 데이터:', profileData);
      
      // 기본 필드만 먼저 저장 시도
      const { data: savedProfile, error: saveError } = await supabaseClient
        .from('profiles')
        .upsert(profileData)
        .select();
      
      if (saveError) {
        console.error('기본 프로필 저장 오류:', saveError);
        console.error('오류 코드:', saveError.code);
        console.error('오류 메시지:', saveError.message);
        console.error('오류 상세:', saveError.details);
        
        showTemporaryModal(`프로필 저장에 실패했습니다 (${saveError.code}). 다시 로그인 후 시도해주세요.`);
        return;
      }
      
      console.log('기본 프로필 저장 성공:', savedProfile);
      
      // 추가 필드 저장 시도
      console.log('추가 필드 저장 시도...');
      try {
        const additionalFields = {
          student_id: formData.studentId.trim(),
          grade: formData.grade.trim(),
          university: formData.university.trim(),
          department: formData.department.trim(),
          instagram_id: formData.instagramId.trim(),
          avatar_url: formData.image,
        };
        
        console.log('저장할 추가 정보:', additionalFields);
        
        const { data: updatedProfile, error: updateError } = await supabaseClient
          .from('profiles')
          .update(additionalFields)
          .eq('user_id', user.id)
          .select();
        
        if (updateError) {
          console.warn('추가 정보 저장 중 오류 발생:', updateError);
          console.warn('일부 정보만 저장되었습니다. 프로필 설정에서 추가 정보를 입력해주세요.');
        } else {
          console.log('모든 프로필 정보가 성공적으로 저장되었습니다:', updatedProfile);
        }
      } catch (additionalError) {
        console.warn('추가 필드 저장 중 예외 발생:', additionalError);
        console.warn('기본 프로필은 저장되었습니다. 프로필 설정에서 추가 정보를 입력해주세요.');
      }
      
      // 저장 성공 메시지 표시
      showTemporaryModal('프로필이 저장되었습니다!');
      
      // 모달 닫을 때 홈 페이지로 이동하도록 설정
      setTimeout(() => {
        setShowSuccessModal(false);
        setTimeout(() => {
          router.push('/home');
        }, 200);
      }, 1500);
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
        console.log('온보딩 페이지: 인증 상태 확인 중...', { 
          isAuthenticated: !!user,
          hasProfile: !!profile,
          hasCompletedOnboarding
        });

        if (authLoading) {
          // 인증 상태 로딩 중인 경우 대기
          console.log('인증 상태 로딩 중, 대기...');
          return;
        }
        
        if (!user) {
          console.log('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
          return;
        }

        console.log('사용자 확인됨:', user.id);

        // 온보딩 완료 여부 확인
        if (hasCompletedOnboarding) {
          console.log('이미 온보딩을 완료했습니다. 홈으로 이동합니다.');
          router.push('/home');
          return;
        }

        console.log('온보딩 진행 필요. 페이지 로딩 완료.');
        setIsLoading(false);
      } catch (error) {
        console.error('인증 확인 중 오류 발생:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router, user, profile, hasCompletedOnboarding, authLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-6 rounded-xl shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">인증 정보 확인 중...</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요...</p>
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

      {/* 성공 메시지 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              {modalMessage}
            </h3>
            <p className="text-sm text-gray-600 text-center mb-2">
              홈 화면으로 이동합니다...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}