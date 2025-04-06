'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, loading: authLoading } = useAuth();
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
  
  const [universities, setUniversities] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);

  const studentIds = ['25학번', '24학번', '23학번', '22학번', '21학번', '20학번', '19학번', '18학번', '17학번'];
  const grades = Array.from({ length: 5 }, (_, i) => `${i + 1}학년`);

  // 대학교 목록 조회
  const fetchUniversities = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/universities`);
      if (!response.ok) throw new Error('대학교 목록 조회 실패');
      const data = await response.json();
      setUniversities(data);
    } catch (error) {
      console.error('대학교 목록 조회 중 오류:', error);
    }
  };

  // 학과 목록 조회
  const fetchDepartments = async (university: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/universities/departments?university=${encodeURIComponent(university)}`
      );
      if (!response.ok) throw new Error('학과 목록 조회 실패');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('학과 목록 조회 중 오류:', error);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUni = e.target.value;
    setSelectedUniversity(selectedUni);
    setFormData({ ...formData, university: selectedUni, department: '' });
    setErrors({ ...errors, university: false });
    setDepartmentSearch('');
    if (selectedUni) {
      fetchDepartments(selectedUni);
    }
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

    try {
      // 대학교 인증 요청 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/universities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          universityName: formData.university,
          department: customDepartment
        })
      });

      if (!response.ok) throw new Error('학과 등록 요청 실패');

      // 폼 데이터 업데이트
      setFormData({ ...formData, department: customDepartment });
      setErrors({ ...errors, department: false });
      
    } catch (error) {
      console.error('학과 등록 요청 중 오류:', error);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageErrors, setImageErrors] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + imageFiles.length > 3) {
      setImageErrors('프로필 사진은 최대 3장까지 업로드 가능합니다.');
      return;
    }

    // 파일 형식 검증
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
      if (!validTypes.includes(file.type)) {
        setImageErrors('지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WEBP, HEIC 파일만 가능)');
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        setImageErrors('20MB 이하의 파일만 업로드 가능합니다.');
        return false;
      }
      return true;
    });

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
    const universityValue = formData.university?.trim() || '';
    const departmentValue = formData.department?.trim() || '';
    const studentIdValue = formData.studentId?.trim() || '';
    const gradeValue = formData.grade?.trim() || '';
    const instagramIdValue = formData.instagramId?.trim() || '';

    const newErrors = {
      university: !universityValue,
      department: !departmentValue,
      studentId: !studentIdValue,
      grade: !gradeValue,
      instagramId: !instagramIdValue
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error);
    if (hasErrors) {
      setShowModal(true);
    }

    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || imageFiles.length < 3) {
      if (imageFiles.length < 3) {
        setImageErrors('프로필 사진 3장을 모두 업로드해주세요.');
      }
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/');
        return;
      }

      // 1. 대학교 인증 요청
      const universityResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/universities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          universityName: formData.university,
          department: formData.department,
          studentNumber: formData.studentId,
          grade: formData.grade
        })
      });

      if (!universityResponse.ok) {
        throw new Error('대학교 인증 실패');
      }

      // 2. 인스타그램 아이디 등록
      const instagramResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/instagram`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          instagramId: formData.instagramId
        })
      });

      if (!instagramResponse.ok) {
        throw new Error('인스타그램 아이디 등록 실패');
      }

      // 3. 이미지 업로드
      const formDataToSend = new FormData();
      imageFiles.forEach((file, index) => {
        formDataToSend.append('files', file);
      });

      console.log('Sending files:', imageFiles);
      console.log('FormData entries:', Array.from(formDataToSend.entries()));
      console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);

      const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.message || '이미지 업로드 실패');
      }

      const imageResult = await imageResponse.json();
      console.log('Image upload result:', imageResult);

      setModalMessage('프로필이 저장되었습니다!');
      setShowSuccessModal(true);
      setTimeout(() => {
        router.push('/profile');
      }, 2000);

    } catch (error) {
      console.error('프로필 저장 중 오류:', error);
      let errorMessage = '프로필 저장 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setModalMessage(errorMessage);
      setShowModal(true);
    }
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authLoading) {
          return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No access token found');
          router.push('/');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router, authLoading]);

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