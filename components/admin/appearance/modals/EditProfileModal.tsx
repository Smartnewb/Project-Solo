import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
  Chip,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
  Radio,
  RadioGroup
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdminService from '@/app/services/admin';
import { UserDetail } from '../UserDetailModal';
import axiosServer from '@/utils/axios';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userDetail: UserDetail | null;
  onSuccess?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  userId,
  userDetail,
  onSuccess
}) => {
  // 성격 유형 옵션
  const personalityOptions = [
    '활발한', '차분한', '사교적인', '내향적인', '창의적인',
    '논리적인', '감성적인', '실용적인', '모험적인', '안정적인',
    '낙천적인', '신중한', '자신감 있는', '겸손한', '유머러스한',
    '진지한', '열정적인', '침착한', '독립적인', '협동적인'
  ];

  // 데이팅 스타일 옵션
  const datingStyleOptions = [
    '로맨틱한', '자유로운', '계획적인', '즉흥적인', '헌신적인',
    '독립적인', '적극적인', '수동적인', '대화를 중시하는', '행동을 중시하는',
    '감성적인', '이성적인', '보수적인', '개방적인', '느긋한',
    '열정적인', '신중한', '모험적인', '안정적인', '변화를 추구하는'
  ];

  // 라이프스타일 옵션
  const lifestyleOptions = [
    '아침형', '저녁형', '집돌이/집순이', '외향적인', '운동을 좋아하는',
    '영화 감상', '여행 좋아함', '독서광', '음악 애호가', '요리 좋아함',
    '게임 좋아함', '반려동물과 함께', '카페 탐방', '맛집 탐방',
    '자기계발', '예술 활동', '사진 촬영', '명상/요가', '봉사활동',
    '쇼핑 좋아함', '자연 친화적', '도시 생활 선호', '미니멀리스트'
  ];

  // 군필 여부 옵션
  const militaryServiceOptions = [
    { value: 'YES', label: '군필' },
    { value: 'NO', label: '미필' },
    { value: 'EXEMPTION', label: '면제' },
    { value: 'SERVING', label: '복무중' }
  ];

  // 학번 목록
  const studentIdOptions = [
    '19학번', '20학번', '21학번', '22학번', '23학번', '24학번',
    '25학번', '26학번', '27학번', '28학번', '29학번', '30학번'
  ];

  // 학년 목록
  const gradeOptions = ['1학년', '2학년', '3학년', '4학년', '5학년'];

  // 대학교 및 학과 목록
  const [universities, setUniversities] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phoneNumber: '',
    instagramId: '',
    // 대학교 정보
    university: '',
    department: '',
    grade: '',
    studentNumber: '',
    // 추가 정보
    mbti: '',
    height: '',
    drinking: '',
    smoking: '',
    // 토글 형태로 변환할 필드
    isSmoking: false,
    isDrinking: false,
    hasTattoo: false,
    // 군필 여부 (남성만 해당)
    militaryService: '', // 'YES', 'NO', 'EXEMPTION', 'SERVING'
    // 다중 선택 필드
    personalities: [] as string[],
    datingStyles: [] as string[],
    lifestyles: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 대학교 목록 조회
  const fetchUniversities = async () => {
    try {
      setLoadingUniversities(true);

      // AdminService를 사용하여 대학교 목록 조회
      const universityList = await AdminService.universities.getUniversities();

      setUniversities(universityList);
      console.log('대학교 목록 조회 성공:', universityList);
    } catch (error) {
      console.error('대학교 목록 조회 중 오류:', error);
      // 기본 대학교 목록 설정 (실제 DB에 있는 대학교 목록)
      setUniversities([
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
        '우송정보대학'
      ]);
    } finally {
      setLoadingUniversities(false);
    }
  };

  // 학과 목록 조회
  const fetchDepartments = async (university: string) => {
    if (!university) {
      setDepartments([]);
      return;
    }

    try {
      setLoadingDepartments(true);

      // AdminService를 사용하여 학과 목록 조회
      const departmentList = await AdminService.universities.getDepartments(university);

      setDepartments(departmentList);
      console.log('학과 목록 조회 성공:', departmentList);
    } catch (error) {
      console.error('학과 목록 조회 중 오류:', error);
      // 기본 학과 목록 설정 (대학교에 따라 다른 학과 목록)
      const departmentsByUniversity: {[key: string]: string[]} = {
        '건양대학교(메디컬캠퍼스)': [
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
          '뷰티케어학과', '생명공학과', '소프트웨어공학부(게임공학)', '소프트웨어공학부(소프트웨어학)', '소프트웨어공학부(정보보안학)', '소프트웨어공학부(컴퓨터공학)', '스마트배터리학과',
          '식품영양학과', '실내건축학과', '심리상담학과', '아트앤웹툰학부(게임애니메이션)', '아트앤웹툰학부(아트앤웹툰)', '외식조리학과', '원예산림학과', '유아교육과', '의류패션학과', '일본학과',
          '자율전공학부', '전기전자공학과', '조경학과', '철도건설공학과', '평생교육융합학부(지역소상공비즈니스)', '평생교육융합학부(토털라이프스타일링)', '평생교육융합학부(토털라이프케어)',
          '항공서비스학과', '행정학과', '호텔항공경영학과'
        ],
        '우송대학교': [
          'AI·빅데이터학과', '간호학과', '글로벌조리학부 Lyfe조리전공', '글로벌조리학부 글로벌외식창업전공', '글로벌조리학부 글로벌조리전공', '글로벌호텔매니지먼트학과',
          '동물의료관리학과', '물류시스템학과', '물리치료학과', '보건의료경영학과', '뷰티디자인경영학과', '사회복지학과', '소방·안전학부', '소프트웨어학부 컴퓨터·소프트웨어전공',
          '소프트웨어학부 컴퓨터공학전공', '솔브릿지경영학부', '스포츠건강재활학과', '언어치료·청각재활학과', '외식조리영양학과', '외식조리학부 외식·조리경영전공', '외식조리학부 외식조리전공',
          '외식조리학부 제과제빵·조리전공', '외식조리학부 한식·조리과학전공', '유아교육과', '융합경영학부 경영학전공', '융합경영학부 글로벌융합비즈니스학과', '응급구조학과', '자유전공학부',
          '작업치료학과', '철도건설시스템학부 건축공학전공', '철도건설시스템학부 글로벌철도학과', '철도건설시스템학부 철도건설시스템전공', '철도경영학과', '철도시스템학부 철도소프트웨어전공',
          '철도시스템학부 철도전기시스템전공', '철도차량시스템학과', '테크노미디어융합학부 게임멀티미디어전공', '테크노미디어융합학부 글로벌미디어영상학과', '테크노미디어융합학부 미디어디자인·영상전공',
          '호텔관광경영학과', '휴먼디지털인터페이스학부'
        ],
        '한남대학교': [
          'AI융합학과', '간호학과', '건축공학전공', '건축학과(5년제)', '경영정보학과', '경영학과', '경제학과', '경찰학과', '교육학과', '국어교육과',
          '국어국문·창작학과', '기계공학과', '기독교학과', '린튼글로벌스쿨', '멀티미디어공학과', '무역물류학과', '문헌정보학과', '미디어영상학과', '미술교육과',
          '바이오제약공학과', '법학부', '빅데이터응용학과', '사학과', '사회복지학과', '사회적경제기업학과', '산업경영공학과', '상담심리학과', '생명시스템과학과', '수학과',
          '수학교육과', '스포츠과학과', '식품영양학과', '신소재공학과', '아동복지학과', '역사교육과', '영어교육과', '영어영문학과', '융합디자인학과', '응용영어콘텐츠학과',
          '일어일문학전공', '자율전공학부', '전기전자공학과', '정보통신공학과', '정치·언론학과', '중국경제통상학과', '컴퓨터공학과', '토목환경공학전공', '패션디자인학과', '프랑스어문학전공',
          '행정학과', '호텔항공경영학과', '화학공학과', '화학과', '회계학과', '회화과'
        ],
        '충남대학교': [
          '간호학과', '건설공학교육과', '건축학과(5)', '경영학부', '경제학과', '고고학과', '공공안전융합전공', '관현악과', '교육학과', '국사학과',
          '국어교육과', '국어국문학과', '국토안보학전공', '기계공학교육과', '기계공학부', '기술교육과', '농업경제학과', '도시·자치융합학과', '독어독문학과',
          '동물자원생명과학과', '디자인창의학과', '리더십과조직과학전공', '메카트로닉스공학과', '무역학과', '무용학과', '문헌정보학과', '문화와사회융합전공',
          '물리학과', '미생물·분자생명과학과', '반도체융합학과', '불어불문학과', '사학과', '사회복지학과', '사회학과', '산림환경자원학과', '생명정보융합학과', '생물과학과',
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
        '을지대학교': ['의예과'],
        '대전과학기술대학교': [
          '간호학과(4년제)', '경찰경호학과', '광고홍보디자인학과', '글로벌산업학과', '도시건설과', '문헌정보과 (야)', '물리치료과', '미래문화콘텐츠과',
          '반려동물학과', '보건복지상담과', '부동산재테크과', '부동산행정정보학과', '뷰티디자인계열', '사회복지학과', '스포츠건강관리학과', '식물생활조경학과',
          '실내건축디자인과', '외식조리제빵계열', '유아교육과', '임상병리과', '전기과', '컴퓨터공학&그래픽과', '컴퓨터소프트웨어공학과', '케어복지상담과 (야)', '치위생과'
        ],
        '대전보건대학교': [
          'HiT자율전공학부', '간호학과(4년제)', '경찰과학수사학과', '국방응급의료과', '물리치료학과', '바이오의약과', '반려동물과', '방사선학과',
          '보건의료행정학과', '뷰티케어과', '사회복지학과', '스포츠건강관리과', '안경광학과', '유아교육학과', '응급구조학과', '의무부사관과(응급구조학전공)', '임상병리학과',
          '작업치료학과', '장례지도과', '재난소방·건설안전과', '치기공학과', '치위생학과', '컴퓨터정보학과', '패션컬러·스타일리스트과', '호텔조리&제과제빵과', '환경안전보건학과'
        ],
        '우송정보대학': [
          'AI응용과', 'K-뷰티학부', 'K-베이커리학부', 'K-푸드조리과', 'e-스포츠과', '간호학과', '글로벌실용예술학부', '동물보건과', '리모델링건축과', '만화웹툰과',
          '반려동물학부', '보건의료행정과', '뷰티디자인학부', '사회복지과', '산업안전과 (야)', '스마트자동차기계학부', '스마트팩토리과', '외식조리학부', '유아교육과',
          '일본외식조리학부', '자율전공학부', '재난소방안전관리과', '제과제빵과', '창업조리제빵과', '철도전기안전과', '철도차량운전과', '철도토목안전과 (야)', '호텔관광과'
        ]
      };

      // 대학교명에 따라 학과 목록 반환
      // 건양대학교(메디컬캠퍼스)의 경우 건양대학교로 키 변환
      const universityKey = university === '건양대학교(메디컬캠퍼스)' ? '건양대학교(메디컬캠퍼스)' : university;

      // 해당 대학교의 학과 목록이 있으면 반환, 없으면 기본 학과 목록 반환
      if (departmentsByUniversity[universityKey]) {
        setDepartments(departmentsByUniversity[universityKey]);
      } else {
        // 기본 학과 목록
        setDepartments([
          '컴퓨터공학과', '소프트웨어학과', '정보통신공학과', '전자공학과', '기계공학과',
          '건축공학과', '경영학과', '경제학과', '심리학과', '사회학과',
          '국어국문학과', '영어영문학과', '화학과', '물리학과', '생명과학과'
        ]);
      }
    } finally {
      setLoadingDepartments(false);
    }
  };

  // 컴포넌트 마운트 시 대학교 목록 조회
  useEffect(() => {
    fetchUniversities();
  }, []);

  // 대학교 변경 시 학과 목록 조회
  useEffect(() => {
    if (formData.university) {
      fetchDepartments(formData.university);
    }
  }, [formData.university]);

  // 유저 정보로 폼 초기화
  useEffect(() => {
    if (userDetail) {
      // DB 데이터 로깅
      console.log('사용자 상세 정보 로드:', userDetail);

      // 토글 필드 변환
      const isSmoking = userDetail.smoking === 'YES';
      const isDrinking = userDetail.drinking === 'MODERATE' || userDetail.drinking === 'HEAVY';
      const hasTattoo = userDetail.tattoo === 'YES';

      setFormData({
        name: userDetail.name || '',
        age: userDetail.age ? String(userDetail.age) : '',
        gender: userDetail.gender || '',
        phoneNumber: userDetail.phoneNumber || '',
        instagramId: userDetail.instagramId || '',
        // 대학교 정보
        university: userDetail.universityDetails?.name || userDetail.university || '',
        department: userDetail.universityDetails?.department || '',
        grade: userDetail.universityDetails?.grade || '',
        studentNumber: userDetail.universityDetails?.studentNumber || '',
        // 추가 정보
        mbti: userDetail.mbti || '',
        height: userDetail.height ? String(userDetail.height) : '',
        drinking: userDetail.drinking || '',
        smoking: userDetail.smoking || '',
        // 토글 형태로 변환한 필드
        isSmoking,
        isDrinking,
        hasTattoo,
        // 군필 여부 (남성만 해당)
        militaryService: userDetail.militaryService || '',
        // 다중 선택 필드
        personalities: Array.isArray(userDetail.personalities) ? userDetail.personalities : [],
        datingStyles: Array.isArray(userDetail.datingStyles) ? userDetail.datingStyles : [],
        lifestyles: Array.isArray(userDetail.lifestyles) ? userDetail.lifestyles : []
      });

      // 대학교가 있으면 해당 대학교의 학과 목록 조회
      if (userDetail.universityDetails?.name || userDetail.university) {
        fetchDepartments(userDetail.universityDetails?.name || userDetail.university || '');
      }
    }
  }, [userDetail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 토글 스위치 변경 핸들러
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));

    // 관련 필드 자동 업데이트
    if (name === 'isSmoking') {
      setFormData(prev => ({
        ...prev,
        smoking: checked ? 'YES' : 'NO'
      }));
    } else if (name === 'isDrinking') {
      setFormData(prev => ({
        ...prev,
        drinking: checked ? 'MODERATE' : 'NONE'
      }));
    } else if (name === 'hasTattoo') {
      setFormData(prev => ({
        ...prev,
        tattoo: checked ? 'YES' : 'NO'
      }));
    }
  };

  // 체크박스 변경 핸들러 (personalities, datingStyles 등)
  const handleCheckboxChange = (name: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[name as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [name]: newValues
      };
    });
  };

  // 다중 선택 필드 변경 핸들러 (personalities, datingStyles 등)
  const handleMultiSelectChange = (name: string, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // 토글 필드를 DB 형식으로 변환
      const smoking = formData.isSmoking ? 'YES' : 'NO';
      const drinking = formData.isDrinking ? 'MODERATE' : 'NONE';
      const tattoo = formData.hasTattoo ? 'YES' : 'NO';

      // API 스키마에 맞게 데이터 구성
      // UpdateUserProfileRequest 스키마 참조
      const profileData = {
        // 필수 필드
        userId: userId,

        // 기본 정보
        name: formData.name,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        instagramId: formData.instagramId || null,
        height: formData.height ? parseInt(formData.height, 10) : undefined,
        mbti: formData.mbti,

        // 대학교 정보
        universityDetails: {
          name: formData.university,
          department: formData.department,
          grade: formData.grade,
          studentNumber: formData.studentNumber,
          authentication: true // 관리자가 수정하는 경우 인증된 것으로 간주
        },

        // 생활 습관 정보
        smoking,
        drinking,
        tattoo,

        // 군필 여부
        militaryService: formData.militaryService || null,

        // 다중 선택 필드
        personalities: formData.personalities,
        datingStyles: formData.datingStyles,
        lifestyles: formData.lifestyles,

        // 수정 사유
        reason: '관리자에 의한 프로필 직접 수정'
      };

      console.log('프로필 업데이트 요청 데이터:', profileData);

      // 실제 API 호출
      const response = await AdminService.userAppearance.updateUserProfile(userId, profileData);
      console.log('프로필 업데이트 응답:', response);

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      console.error('프로필 수정 오류:', error);
      setError(error.message || '프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          height: 'auto'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EditIcon color="primary" sx={{ mr: 1 }} />
          프로필 직접 수정
        </Box>
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            프로필이 성공적으로 수정되었습니다.
          </Alert>
        ) : (
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Typography variant="body2" sx={{ mb: 3 }}>
              사용자의 프로필 정보를 직접 수정합니다. 이 작업은 즉시 반영됩니다.
            </Typography>

            <Grid container spacing={2}>
              {/* 기본 정보 섹션 */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  기본 정보
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="이름"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="나이"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ min: 18, max: 100 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="gender-label">성별</InputLabel>
                  <Select
                    labelId="gender-label"
                    name="gender"
                    value={formData.gender}
                    label="성별"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="MALE">남성</MenuItem>
                    <MenuItem value="FEMALE">여성</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="키 (cm)"
                  name="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ min: 140, max: 220 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="전화번호"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="010-1234-5678"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="인스타그램 ID"
                  name="instagramId"
                  value={formData.instagramId}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="instagram_id"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="MBTI"
                  name="mbti"
                  value={formData.mbti}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="ENFP"
                />
              </Grid>

              {/* 대학교 정보 섹션 */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  대학교 정보
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  options={universities}
                  value={formData.university}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      university: newValue || '',
                      department: '' // 대학교 변경 시 학과 초기화
                    }));
                  }}
                  loading={loadingUniversities}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="대학교"
                      placeholder="대학교 선택"
                      disabled={loading}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingUniversities ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  options={departments}
                  value={formData.department}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      department: newValue || ''
                    }));
                  }}
                  loading={loadingDepartments}
                  disabled={!formData.university || loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="학과"
                      placeholder="학과 선택"
                      disabled={!formData.university || loading}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingDepartments ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Typography variant="body2" sx={{ mb: 1 }}>학년</Typography>
                  <ToggleButtonGroup
                    value={formData.grade}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) {
                        setFormData(prev => ({
                          ...prev,
                          grade: newValue
                        }));
                      }
                    }}
                    aria-label="학년"
                    disabled={loading}
                    sx={{ display: 'flex', flexWrap: 'wrap' }}
                  >
                    {gradeOptions.map((grade) => (
                      <ToggleButton
                        key={grade}
                        value={grade.replace('학년', '')}
                        sx={{ flex: '1 0 18%', minWidth: '50px' }}
                      >
                        {grade}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="student-id-label">학번</InputLabel>
                  <Select
                    labelId="student-id-label"
                    name="studentNumber"
                    value={formData.studentNumber}
                    label="학번"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="">선택 안함</MenuItem>
                    {studentIdOptions.map((studentId) => (
                      <MenuItem key={studentId} value={studentId}>
                        {studentId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 군필 여부 섹션 (남성인 경우에만 표시) */}
              {formData.gender === 'MALE' && (
                <>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                      군필 여부
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        row
                        name="militaryService"
                        value={formData.militaryService}
                        onChange={handleChange}
                      >
                        {militaryServiceOptions.map((option) => (
                          <FormControlLabel
                            key={option.value}
                            value={option.value}
                            control={<Radio disabled={loading} />}
                            label={option.label}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </>
              )}

              {/* 생활 습관 정보 섹션 */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  생활 습관 정보
                </Typography>
              </Grid>

              {/* 토글 스위치로 변경 */}
              <Grid item xs={12}>
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isDrinking}
                        onChange={handleToggleChange}
                        name="isDrinking"
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label="음주"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isSmoking}
                        onChange={handleToggleChange}
                        name="isSmoking"
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label="흡연"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hasTattoo}
                        onChange={handleToggleChange}
                        name="hasTattoo"
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label="타투"
                  />
                </Box>
              </Grid>

              {/* 라이프스타일 섹션 */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  라이프스타일
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  {lifestyleOptions.map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      onClick={() => handleCheckboxChange('lifestyles', option)}
                      color={formData.lifestyles.includes(option) ? 'primary' : 'default'}
                      variant={formData.lifestyles.includes(option) ? 'filled' : 'outlined'}
                      sx={{ m: 0.5 }}
                      disabled={loading}
                    />
                  ))}
                </Box>
              </Grid>

              {/* 선택된 라이프스타일 표시 */}
              {formData.lifestyles.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    선택된 라이프스타일: {formData.lifestyles.join(', ')}
                  </Typography>
                </Grid>
              )}

              {/* 기존 셀렉트 박스는 주석 처리 (필요시 제거)
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="drinking-label">음주</InputLabel>
                  <Select
                    labelId="drinking-label"
                    name="drinking"
                    value={formData.drinking}
                    label="음주"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="NONE">안 마심</MenuItem>
                    <MenuItem value="LIGHT">가볍게 마심</MenuItem>
                    <MenuItem value="MODERATE">적당히 마심</MenuItem>
                    <MenuItem value="HEAVY">자주 마심</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="smoking-label">흡연</InputLabel>
                  <Select
                    labelId="smoking-label"
                    name="smoking"
                    value={formData.smoking}
                    label="흡연"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="YES">흡연</MenuItem>
                    <MenuItem value="NO">비흡연</MenuItem>
                    <MenuItem value="SOMETIMES">가끔 흡연</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              */}

              {/* 성격 및 데이팅 스타일 섹션 */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  성격 및 데이팅 스타일
                </Typography>
              </Grid>

              {/* 성격 유형 체크박스 */}
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">성격 유형</FormLabel>
                  <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 1,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1
                  }}>
                    {personalityOptions.map((option) => (
                      <Chip
                        key={option}
                        label={option}
                        onClick={() => handleCheckboxChange('personalities', option)}
                        color={formData.personalities.includes(option) ? 'primary' : 'default'}
                        variant={formData.personalities.includes(option) ? 'filled' : 'outlined'}
                        sx={{ m: 0.5 }}
                        disabled={loading}
                      />
                    ))}
                  </Box>
                </FormControl>
              </Grid>

              {/* 데이팅 스타일 체크박스 */}
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">데이팅 스타일</FormLabel>
                  <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 1,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1
                  }}>
                    {datingStyleOptions.map((option) => (
                      <Chip
                        key={option}
                        label={option}
                        onClick={() => handleCheckboxChange('datingStyles', option)}
                        color={formData.datingStyles.includes(option) ? 'primary' : 'default'}
                        variant={formData.datingStyles.includes(option) ? 'filled' : 'outlined'}
                        sx={{ m: 0.5 }}
                        disabled={loading}
                      />
                    ))}
                  </Box>
                </FormControl>
              </Grid>

              {/* 선택된 항목 표시 */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>선택된 성격 유형:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.personalities.length > 0 ? (
                      formData.personalities.map(item => (
                        <Chip
                          key={`selected-${item}`}
                          label={item}
                          color="primary"
                          onDelete={() => handleCheckboxChange('personalities', item)}
                          disabled={loading}
                          size="small"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">선택된 성격 유형이 없습니다.</Typography>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>선택된 데이팅 스타일:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.datingStyles.length > 0 ? (
                      formData.datingStyles.map(item => (
                        <Chip
                          key={`selected-${item}`}
                          label={item}
                          color="secondary"
                          onDelete={() => handleCheckboxChange('datingStyles', item)}
                          disabled={loading}
                          size="small"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">선택된 데이팅 스타일이 없습니다.</Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || success || !formData.name}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '저장 중...' : '저장하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileModal;
