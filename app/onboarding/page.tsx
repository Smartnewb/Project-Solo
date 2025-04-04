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
  instagramId: string;
  image?: string;
}

interface ValidationErrors {
  university: boolean;
  department: boolean;
  studentId: boolean;
  grade: boolean;
  instagramId: boolean;
}

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const { user, profile, hasCompletedOnboarding, loading: authLoading, updateProfile: updateAuthProfile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingForm>({
    university: '',
    department: '',
    studentId: '',
    grade: '',
    instagramId: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({
    university: false,
    department: false,
    studentId: false,
    grade: false,
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
    '건양대학교(메디컬캠퍼스)',
    '대전대학교',
    '목원대학교',
    '배재대학교',
    '우송대학교',
    '한남대학교',
    '충남대학교',
    'KAIST',
    '한밭대학교',
    '을지대학교',
    '대덕대학교',
    '대전과학기술대학교',
    '대전보건대학교',
    '우송정보대학',
  ];

  const studentIds = ['25학번', '24학번', '23학번', '22학번', '21학번', '20학번', '19학번', '18학번', '17학번'];
  const grades = Array.from({ length: 5 }, (_, i) => `${i + 1}학년`);

  // 대학별 학과 정보
  const departmentsByUniversity: DepartmentsByUniversity = {
    '건양대학교': [
      '간호학과', '물리치료학과', '방사선학과', '병원경영학과', '안경광학과', '응급구조학과', '의공학과', '의료IT공학과', '의료공간디자인학과', '의료신소재학과', '의약바이오학과', '인공지능학과', '임상병리학과', '작업치료학과', '제약생명공학과', '치위생학과'
    ],
    '대전대학교': [
      'AI소프트웨어학부', '간호학과', '건축공학과', '건축학과(4)', '경영학부', '경찰학과', '공연예술영상콘텐츠학과', '군사학과', '디지털헬스케어학과', '물리치료학과', '물류통상학과', '반도체공학과', '법행정학부', '보건의료경영학과', '뷰티디자인학과', '비즈니스영어학과', '비즈니스일본어학과', '사회복지학과', '산업·광고심리학과', '상담학과', '소방방재학과', '스포츠건강재활학과', '스포츠운동과학과', '식품영양학과', '웹툰애니메이션학과', '응급구조학과', '임상병리학과', '재난안전공학과', '정보보안학과', '정보통신공학과', '중등특수교육과', '커뮤니케이션디자인학과', '컴퓨터공학과', '토목환경공학과', '패션디자인·비즈니스학과', '한의예과', '협화리버럴아츠칼리지', '협화커뮤니티칼리지', '화장품학과'
    ],
    '목원대학교': [
      'AI응용학과', '건축학부', '게임소프트웨어공학과', '게임콘텐츠학과', '경영학부', '경찰법학과', '경찰행정학부', '공연콘텐츠학과', '관현악학부', '광고홍보커뮤니케이션학부', 
      '국악과', '국어교육과', '국际예술·한국어학부', '금융경제학과', '도시공학과', '도자디자인학과', '마케팅빅데이터학과', '미술교육과', '미술학부', '보건의료행정학과', '부동산금융보험학과', 
      '사회복지학과', '산업디자인학과', '생물산업학부', '섬유·패션디자인학과', '소방방재학과', '수학교육과', '스포츠건강관리학과', '시각커뮤니케이션디자인학과', '식품제약학부', '신학과', 
      '실용음악학부', '애니메이션학과', '역사학과', '연극영화영상학부', '영어교육과', '영어학과', '외식조리·제과제빵학과', '웹툰학과', '유아교육과', '음악교육과', '응급구조학과', '입체조형학부', 
      '자율전공학부', '전기전자공학과', '창의예술자율전공학부', '컴퓨터공학과', '피아노학부', '항공호텔관광경영학과', '화장품학과'
    ],
    '배재대학교': [
      'IT경영정보학과', '간호학과', '건축학과', '경영학과', '경찰법학부', '공연예술학과', '관광경영학과', '광고사진영상학과', '국어국문한국어교육학과', '글로벌비즈니스학과', 
      '글로벌자율융합학부(글로벌IT)', '글로벌자율융합학부(글로벌경영)', '글로벌자율융합학부(직무한국어번역)', '글로벌자율융합학부(한류문화콘텐츠)', '드론로봇공학과', 
      '디자인학부(산업디자인)', '디자인학부(커뮤니케이션디자인)', '레저스포츠학부(스포츠마케팅)', '레저스포츠학부(스포츠지도·건강재활)', '미디어콘텐츠학과', '보건의료복지학과', 
      '뷰티케어학과', ' 생명공학과', '소프트웨어공학부(게임공학)', '소프트웨어공학부(소프트웨어학)', '소프트웨어공학부(정보보안학)', '소프트웨어공학부(컴퓨터공학)', '스마트배터리학과', 
      '식품영양학과', '실내건축학과', '심리상담학과', '아트앤웹툰학부(게임애니메이션)', '아트앤웹툰학부(아트앤웹툰)', '외식조리학과', '원예산림학과', '유아교육과', '의류패션학과', '일본학과', 
      '자율전공학부', '전기전자공학과', '조경학과', '철도건설공학과', '평생교육융합학부(지역소상공비즈니스)', '평생교육융합학부(토털라이프스타일링)', '평생교육융합학부(토털라이프케어)', 
      '항공서비스학과', '행정학과', ' 호텔항공경영학과'
    ],
    '우송대학교': [
      'AI·빅데이터학과', '간호학과', '글로벌조리학부 Lyfe조리전공', '글로벌조리학부 글로벌외식창업전공', '글로벌조리학부 글로벌조리전공', '글로벌호텔매니지먼트학과', 
      '동물의료관리학과', '물류시스템학과', '물리치료학과', '보건의료경영학과', '뷰티디자인경영학과', '사회복지학과', '소방·안전학부', '소프트웨어학부 컴퓨터·소프트웨어전공', 
      '소프트웨어학부 컴퓨터공학전공', '솔브릿지경영학부', '스포츠건강재활학과', '언어치료·청각재활학과', '외식조리영양학과', '외식조리학부 외식·조리경영전공', '외식조리학부 외식조리전공', 
      '외식조리학부 제과제빵·조리전공', '외식조리학부 한식·조리과학전공', '유아교육과', '융합경영학부 경영학전공', '융합경영학부 글로벌융합비즈니스학과', '응급구조학과', '자유전공학부', 
      '작업치료학과', '철도건설시스템학부 건축공학전공', '철도건설시스템학부 글로벌철도학과', '철도건설시스템학부 철도건설시스템전공', '철도경영학과', '철도시스템학부 철도소프트웨어전공', 
      '철도시스템학부 철도전기시스템전공', '철도차량시스템학과', '테크노미디어융합학부 게임멀티미디어전공', '테크노미디어융합학부 글로벌미디어영상학과', '테크노미디어융합학부 미디어디자인·영상전공', 
      ' 호텔관광경영학과', '휴먼디지털인터페이스학부'
    ],
    '한남대학교': [
      'AI융합학과', '간호학과', '건축공학전공', '건축학과(5년제)', '경영정보학과', '경영학과', '경제학과', '경찰학과', '교육학과', '국어교육과', 
      '국어국문·창작학과', '기계공학과', '기독교학과', '린튼글로벌스쿨', '멀티미디어공학과', '무역물류학과', '문헌정보학과', '미디어영상학과', '미술교육과', 
      '바이오제약공학과', '법학부', '빅데이터응용학과', '사학과', '사회복지학과', '사회적경제기업학과', '산업경영공학과', '상담심리학과', '생명시스템과학과', '수학과', 
      '수학교육과', '스포츠과학과', '식품영양학과', '신소재공학과', '아동복지학과', '역사교육과', '영어교육과', '영어영문학과', '융합디자인학과', '응용영어콘텐츠학과', 
      '일어일문학전공', '자율전공학부', '전기전자공학과', '정보통신공학과', '정치·언론학과', '중국경제통상학과', '컴퓨터공학과', '토목환경공학전공', '패션디자인학과', '프랑스어문학전공', 
      '행정학과', ' 호텔항공경영학과', '화학공학과', '화학과', '회계학과', '회화과'
    ],
    '충남대학교': [
      '간호학과', '건설공학교육과', '건축학과(5)', '경영학부', '경제학과', '고고학과', '공공안전융합전공', '관현악과', '교육학과', '국사학과', 
      '국어교육과', '국어국문학과', '국토안보학전공', '기계공학교육과', '기계공학부', '기술교육과', '농업경제학과', '도시·자치융합학과', '독어독문학과', 
      '동물자원생명과학과', '디자인창의학과', '리더십과조직과학전공', '메카트로닉스공학과', '무역학과', '무용학과', '문헌정보학과', '문화와사회융합전공', 
      '물리학과', '미생물·분자생명과학과', '반도체융합학과', '불어불문학과', '사학과', '사회복지학과', '사회학과', '산림환경자원학과', ' 생명정보융합학과', '생물과학과', 
      '생물환경화학과', '생화학과', '소비자학과', '수의예과', '수학과', '수학교육과', '스마트시티건축공학과', '스포츠과학과', '식물자원학과', '식품공학과', '식품영양학과', 
      '신소재공학과', '심리학과', '약학과', '언론정보학과', '언어학과', '에너지공학과', '영어교육과', '영어영문학과', '원예학과', '유기재료공학과', '음악과', '응용생물학과', 
      '응용화학공학과', '의류학과', '의예과', '인공지능학과', '일어일문학과', '자율운항시스템공학과', '자율전공융합학부', '전기공학과', '전자공학과', '정보통계학과', '정치외교학과', 
      '조소과', '중어중문학과', '지역환경토목학과', '지질환경과학과', '천문우주과학과', '철학과', '체육교육과', '컴퓨터융합학부', '토목공학과', '한문학과', '항공우주공학과', '해양안보학전공', 
      '해양환경과학과', '행정학부', '화학공학교육과', '화학과', '환경공학과', '환경소재공학과', '회화과'
    ],
    'KAIST': [
      '기술경영학부', '기술경영학부(IT경영학)', '건설및환경공학과', '기계공학과', '바이오및뇌공학과', '반도체시스템공학과', '산업디자인학과', '산업및시스템공학과', '생명화학공학과', 
      '신소재공학과', '원자력및양자공학과', '전기및전자공학부', '전산학부', '항공우주공학과', '새내기과정학부(공학계열)', '새내기과정학부(인문사회계열)', '새내기과정학부(자연계열)', 
      '융합인재학부', '뇌인지과학과', '생명과학과', '디지털인문사회과학부', '물리학과', '수리과학과', '화학과'
    ],
    '한밭대학교': [
      '건설환경공학과', '건축공학과', '건축학과(5년제)', '경제학과', '공공행정학과', '기계공학과', 
      '기계소재융합시스템공학과 (야)', '도시공학과', '모바일융합공학과', '반도체시스템공학과', '산업경영공학과', 
      '산업디자인학과', '설비공학과', '스포츠건강과학과 (야)', '시각•영상디자인학과', '신소재공학과', '영어영문학과', 
      '융합경영학과', '융합건설시스템학과 (야)', '인공지능소프트웨어학과', '일본어과', '자율전공학부', '전기공학과', 
      '전기시스템공학과 (야)', '전자공학과', '정보통신공학과', '중국어과', '지능미디어공학과', '창의융합학과', '컴퓨터공학과', 
      '화학생명공학과', '회계세무부동산학과 (야)', '회계세무학과'
    ],
    '을지대학교': ['의예과'
    ],
    '대덕대학교': [
      'K-디자인과', 'K-모델과', 'K-방위산업과', 'K-뷰티과', 'K-외식조리과', 'K-웹툰과',
      '경찰행정과', '국방군사과', '드론로봇과', '레저스포츠과', '미래자동차과', '반도체과',
      '사회복지학과', '생활체육과', '소방·산업안전관리과', '스마트홈융합과',
      '워게임과', '자율전공학부', '전기과', '정밀기계공학과', '컴퓨터공학과', '펫토탈케어과'
    ],
    '대전과학기술대학교': [
      '간호학과(4년제)', '경찰경호학과', '광고홍보디자인학과', '글로벌산업학과', '도시건설과', '문헌정보과 (야)', '물리치료과', '미래문화콘텐츠과', 
      '반려동물학과', '보건복지상담과', '부동산재테크과', '부동산행정정보학과', '뷰티디자인계열', '사회복지학과', '스포츠건강관리학과', '식물생활조경학과', 
      '실내건축디자인과', '외식조리제빵계열', '유아교육과', '임상병리과', '전기과', '컴퓨터공학&그래픽과', '컴퓨터소프트웨어공학과', '케어복지상담과 (야)', '치위생과'
    ],
    '대전보건대학교': [ 'HiT자율전공학부', '간호학과(4년제)', '경찰과학수사학과', '국방응급의료과', '물리치료학과', '바이오의약과', '반려동물과', '방사선학과',
       '보건의료행정학과', '뷰티케어과', '사회복지학과', '스포츠건강관리과', '안경광학과', '유아교육학과', '응급구조학과', '의무부사관과(응급구조학전공)', '임상병리학과', 
       '작업치료학과', '장례지도과', '재난소방·건설안전과', '치기공학과', '치위생학과', '컴퓨터정보학과', '패션컬러·스타일리스트과', '호텔조리&제과제빵과', '환경안전보건학과'],
    '우송정보대학': [
      'AI응용과', 'K-뷰티학부', 'K-베이커리학부', 'K-푸드조리과', 'e-스포츠과', '간호학과', '글로벌실용예술학부', '동물보건과', '리모델링건축과', '만화웹툰과', 
      '반려동물학부', '보건의료행정과', '뷰티디자인학부', '사회복지과', '산업안전과 (야)', '스마트자동차기계학부', '스마트팩토리과', '외식조리학부', '유아교육과', 
      '일본외식조리학부', '자율전공학부', '재난소방안전관리과', '제과제빵과', '창업조리제빵과', '철도전기안전과', '철도차량운전과', '철도토목안전과 (야)', '호텔관광과'
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

  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageErrors, setImageErrors] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + imageFiles.length > 3) {
      setImageErrors('프로필 사진은 최대 3장까지 업로드 가능합니다.');
      return;
    }

    // 파일 형식 검증 - 다양한 이미지 형식 허용
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
      if (!validTypes.includes(file.type)) {
        setImageErrors('지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WEBP, HEIC 파일만 가능)');
        return false;
      }
      if (file.size > 20 * 1024 * 1024) { // 20MB로 제한 상향
        setImageErrors('20MB 이하의 파일만 업로드 가능합니다.');
        return false;
      }
      return true;
    });

    // 미리보기 URL 생성
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setProfileImages(prev => [...prev, ...newPreviewUrls]);
    setImageFiles(prev => [...prev, ...validFiles]);
    setImageErrors(null);
  };

  const handleRemoveImage = (index: number) => {
    setProfileImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
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

      instagramId: instagramIdValue.length > 0 ? '있음' : '없음'
    });

    const newErrors = {
      university: !universityValue,
      department: !departmentValue,
      studentId: !studentIdValue,
      grade: !gradeValue,

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
    
    // 유효성 검사
    const newErrors = {
      ...errors,
      instagramId: !formData.instagramId?.trim()  // 인스타그램 아이디가 비어있거나 공백만 있는 경우
    };
    
    setErrors(newErrors);

    // 에러가 있으면 제출하지 않음
    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    try {
      if (!user) {
        console.error('사용자 정보가 없습니다.');
        return;
      }

      let avatar_url = '';
      
      // 프로필 이미지를 base64로 변환
      if (imageFiles.length > 0) {
        try {
          console.log('이미지 변환 시작');
          const base64Promises = imageFiles.map(async (file) => {
            const reader = new FileReader();
            const promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });
            reader.readAsDataURL(file);
            return promise;
          });
          const base64Results = await Promise.all(base64Promises);
          avatar_url = base64Results.join(',');
          console.log('이미지 base64 변환 성공');
        } catch (error) {
          console.error('이미지 변환 실패:', error);
          setModalMessage('이미지 처리 중 오류가 발생했습니다.');
          setShowModal(true);
          return;
        }
      }

      // 프로필 정보 업데이트
      console.log('프로필 정보 업데이트 시작');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          university: formData.university,
          department: formData.department,
          student_id: formData.studentId,
          grade: formData.grade,
          instagram_id: formData.instagramId,
          avatar_url: avatar_url || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log('프로필 업데이트 성공');
      setModalMessage('프로필이 저장되었습니다!');
      setShowSuccessModal(true);
      setTimeout(() => {
        // 온보딩 완료 후 프로필 페이지로 이동
        router.push('/profile');
      }, 2000);

    } catch (error) {
      console.error('프로필 저장 중 오류 발생:', error);
      setModalMessage('프로필 저장 중 오류가 발생했습니다.');
      setShowModal(true);
    }
  };

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('온보딩 페이지: 인증 상태 확인 중...', { 
          isAuthenticated: !!user,
          hasProfile: !!profile
        });

        if (authLoading) {
          console.log('인증 상태 로딩 중, 대기...');
          return;
        }
        
        if (!user) {
          console.log('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
          return;
        }

        console.log('온보딩 진행 가능. 페이지 로딩 완료.');
        setIsLoading(false);

      } catch (error) {
        console.error('인증 확인 중 오류 발생:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router, user, profile, authLoading]);

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
          {/* 프로필 이미지 업로드 */}
          <div className="card space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                프로필 사진
                <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-1">(3장 필수)</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative">
                    {profileImages[index] ? (
                      <div className="relative w-full pt-[100%]">
                        <img 
                          src={profileImages[index]}
                          alt={`프로필 사진 ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="relative w-full pt-[100%] bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="input-field w-full"
                multiple
              />
              {imageErrors && (
                <p className="text-red-500 text-sm">{imageErrors}</p>
              )}
              {profileImages.length < 3 && (
                <p className="text-red-500 text-sm">프로필 사진 3장을 모두 업로드해주세요.</p>
              )}
              <p className="text-sm text-gray-500">
                얼굴이 잘 보이는 사진을 업로드해주세요. (최대 20MB)
              </p>
            </div>
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
              required
              value={formData.instagramId}
              onChange={(e) => {
                setFormData({ ...formData, instagramId: e.target.value.trim() });
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
              프로필 정보 작성으로 이동합니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}