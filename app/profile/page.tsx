'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import axiosServer from '@/utils/axios';
import axios, { AxiosError } from 'axios';

interface OnboardingForm {
  university: string;
  department: string;
  studentId: string;
  grade: string;
  instagramId: string;
  image?: string;
}

interface ProfileImage {
  id: string;
  url: string;
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

  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
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

        // 사용자 프로필 정보 로드
        await loadProfileData(token);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router, authLoading]);

  // 프로필 정보 로드 함수
  const loadProfileData = async (token: string) => {
    try {
      console.log('프로필 정보 로드 시작');
      const profileResponse = await axiosServer.get('/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const profileData = profileResponse.data;
      console.log('가져온 프로필 정보:', profileData);

      // 프로필 데이터가 있으면 폼 데이터 초기화
      if (profileData) {
        // 대학교 및 학과 정보 설정
        if (profileData.universityInfo) {
          const { universityName, department, studentNumber, grade } = profileData.universityInfo;
          
          setFormData(prev => ({
            ...prev,
            university: universityName || '',
            department: department || '',
            studentId: studentNumber || '',
            grade: grade || ''
          }));

          // 해당 대학의 학과 목록 로드
          if (universityName) {
            setSelectedUniversity(universityName);
            fetchDepartments(universityName);
          }
        }

        // 인스타그램 ID 설정
        if (profileData.instagramId) {
          setFormData(prev => ({
            ...prev,
            instagramId: profileData.instagramId
          }));
        }

        // 프로필 이미지 설정
        if (profileData.profileImages && profileData.profileImages.length > 0) {
          const images = profileData.profileImages;
          console.log('기존 프로필 이미지:', images);
          
          // 이미지 URL 설정
          const imageUrls = images.map((img: any) => img.url);
          setProfileImages(imageUrls);
          
          // uploadedImages 상태 설정
          setUploadedImages(images);
          
          // 대표 이미지 설정
          const mainImage = images.find((img: any) => img.isMain);
          if (mainImage) {
            setSelectedMainImage(mainImage.id);
            console.log('대표 이미지 설정됨:', mainImage.id);
          } else if (images.length > 0) {
            setSelectedMainImage(images[0].id);
            console.log('첫 번째 이미지를 대표로 설정:', images[0].id);
          }
        } else {
          // 이미지가 없는 경우 상태 초기화
          setProfileImages([]);
          setUploadedImages([]);
          setSelectedMainImage(null);
        }
      }

      setIsProfileLoaded(true);
      console.log('프로필 정보 로드 완료');
    } catch (error) {
      console.error('프로필 정보 로드 중 오류:', error);
      if (axios.isAxiosError(error)) {
        // 404 오류는 프로필이 없는 경우이므로 정상 처리
        if (error.response?.status === 404) {
          console.log('프로필 정보가 없습니다. 신규 등록을 진행합니다.');
          setIsProfileLoaded(true);
          return;
        }
        console.log('Axios 에러 상태 코드:', error.response?.status);
        console.log('Axios 에러 메시지:', error.response?.data);
      }
      // 오류가 발생해도 로딩은 완료로 처리
      setIsProfileLoaded(true);
    }
  };

  // 대학교 목록 조회
  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await axiosServer.get('/universities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUniversities(response.data);
    } catch (error) {
      console.error('대학교 목록 조회 중 오류:', error);
    }
  };

  // 학과 목록 조회
  const fetchDepartments = async (university: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await axiosServer.get('/universities/departments', {
        params: { university },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDepartments(response.data);
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
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/');
        return;
      }

      // 대학교 인증 요청 API 호출
      const response = await axiosServer.post('/universities', {
        universityName: formData.university,
        department: customDepartment
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string, url: string}>>([]);
  const [selectedMainImage, setSelectedMainImage] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (validFiles.length === 0) return;

    // 미리보기 URL 생성 및 상태 업데이트
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setProfileImages(prev => [...prev, ...newPreviewUrls]);
    setImageFiles(prev => [...prev, ...validFiles]);
    setImageErrors(null);
    
    // 이미지를 선택하자마자 바로 업로드 진행
    try {
      console.log('이미지 선택 직후 업로드 시작');
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('토큰 없음, 로그인 페이지로 이동');
        router.push('/');
        return;
      }

      const imageFormData = new FormData();
      validFiles.forEach((file, idx) => {
        console.log(`선택한 이미지 ${idx} 추가:`, file.name, file.type, file.size);
        imageFormData.append('files', file);
      });

      console.log('이미지 업로드 API 호출 시작 (선택 직후):', '/profile/images');
      const uploadResponse = await axiosServer.post('/profile/images', imageFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('이미지 업로드 API 응답 상태:', uploadResponse.status);
      const newUploadedImages = uploadResponse.data;
      console.log('이미지 업로드 완료, 응답 데이터:', newUploadedImages);

      // 현재 업로드된 이미지 배열을 복사
      const currentUploadedImages = [...uploadedImages];
      // 새 이미지를 추가
      const updatedImages = [...currentUploadedImages, ...newUploadedImages];
      
      console.log('uploadedImages 업데이트 전:', currentUploadedImages);
      console.log('uploadedImages 업데이트 후:', updatedImages);
      
      // uploadedImages 상태 업데이트
      setUploadedImages(updatedImages);
      
      // 첫 번째 업로드 이미지인 경우, 자동으로 대표 이미지로 설정
      if (currentUploadedImages.length === 0 && newUploadedImages.length > 0) {
        console.log('첫 업로드 이미지를 대표로 설정:', newUploadedImages[0].id);
        setSelectedMainImage(newUploadedImages[0].id);
        await handleSetMainImage(newUploadedImages[0].id);
      }

    } catch (error) {
      console.error('이미지 업로드 중 오류:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios 에러 상태 코드:', error.response?.status);
        console.log('Axios 에러 메시지:', error.response?.data);
        
        // 400 에러가 발생하면 이미 최대 개수의 이미지가 있을 수 있음
        if (error.response?.status === 400 && 
            error.response?.data?.message?.includes('최대')) {
          setImageErrors(error.response.data.message);
          
          // 이미 최대 개수의 이미지가 있으면 프로필 정보를 다시 로드
          const token = localStorage.getItem('accessToken');
          if (token) await loadProfileData(token);
        }
      } else {
        console.log('일반 에러:', error);
      }
      setImageErrors('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 대표 이미지 설정 함수
  const handleSetMainImage = async (imageId: string) => {
    try {
      console.log('handleSetMainImage 호출됨, imageId:', imageId);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('토큰 없음, 로그인 페이지로 이동');
        router.push('/');
        return;
      }

      // UI에 즉시 반영 (비관적 UI 업데이트)
      console.log('대표 이미지 상태 업데이트 전:', selectedMainImage);
      setSelectedMainImage(imageId);
      console.log('대표 이미지 상태 업데이트 후:', imageId);
      
      // API 호출
      console.log('API 호출 시작 - 대표 이미지 설정:', `/profile/images/${imageId}/main`);
      const response = await axiosServer.post(`/profile/images/${imageId}/main`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('API 응답 - 대표 이미지 설정:', response.data);

      console.log(`이미지 ${imageId}가 대표 이미지로 설정되었습니다.`);
    } catch (error) {
      console.error('대표 이미지 설정 중 오류:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios 에러 상태 코드:', error.response?.status);
        console.log('Axios 에러 메시지:', error.response?.data);
        if (error.response?.data?.message) {
          setModalMessage(error.response.data.message);
        } else {
          setModalMessage('대표 이미지 설정 중 오류가 발생했습니다.');
        }
      } else {
        console.log('일반 에러:', error);
        setModalMessage('대표 이미지 설정 중 오류가 발생했습니다.');
      }
      setShowModal(true);
    }
  };

  const handleRemoveImage = (index: number) => {
    // 대표 이미지로 설정되어 있던 이미지를 삭제하는 경우, 선택 상태 초기화
    if (uploadedImages[index] && uploadedImages[index].id === selectedMainImage) {
      setSelectedMainImage(null);
    }
    
    setProfileImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
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

    // 모든 필드가 채워져 있고, 이미지 3장이 업로드 되었는지, 대표 이미지가 선택되었는지 확인
    const hasErrors = Object.values(newErrors).some(error => error);
    const hasThreeImages = uploadedImages.length >= 3;
    const hasMainImage = !!selectedMainImage;
    
    if (hasErrors) {
      setShowModal(true);
    } else if (!hasThreeImages) {
      setImageErrors('프로필 사진 3장을 모두 업로드해주세요.');
      setShowModal(true);
    } else if (!hasMainImage) {
      setImageErrors('대표 이미지를 선택해주세요.');
      setShowModal(true);
    }

    return !hasErrors && hasThreeImages && hasMainImage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/');
        return;
      }

      console.log('프로필 저장 시작, 현재 폼 데이터:', formData);
      console.log('프로필 이미지 정보:', uploadedImages);
      
      // 대표 이미지가 선택되어 있는지 확인
      if (!selectedMainImage && uploadedImages.length > 0) {
        // 대표 이미지가 선택되지 않았지만 이미지가 있으면 첫 번째 이미지를 대표로 설정
        const mainImageId = uploadedImages[0].id;
        console.log('대표 이미지 자동 설정:', mainImageId);
        await handleSetMainImage(mainImageId);
      } else if (!selectedMainImage) {
        throw new Error('대표 이미지가 선택되지 않았습니다.');
      }

      // 필요한 정보만 업데이트
      const updatePromises = [];

      // 대학교 정보 업데이트
      const universityPromise = axiosServer.post('/universities', {
        universityName: formData.university,
        department: formData.department,
        studentNumber: formData.studentId,
        grade: formData.grade
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      updatePromises.push(universityPromise);

      // 인스타그램 아이디 등록
      const instagramPromise = axiosServer.patch('/profile/instagram', {
        instagramId: formData.instagramId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      updatePromises.push(instagramPromise);

      // 모든 업데이트 요청 실행
      await Promise.all(updatePromises);
      console.log('프로필 업데이트 완료');

      setModalMessage('프로필이 저장되었습니다!');
      setShowSuccessModal(true);
      setTimeout(() => {
        router.push('/home');
      }, 2000);

    } catch (error) {
      console.error('프로필 저장 중 오류:', error);
      let errorMessage = '프로필 저장 중 오류가 발생했습니다.';
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setModalMessage(errorMessage);
      setShowModal(true);
    }
  };

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
        <h1 className="text-h2">프로필 설정</h1>
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
                      <div 
                        className={`relative w-full pt-[100%] rounded-lg overflow-hidden cursor-pointer ${
                          uploadedImages[index] && uploadedImages[index].id === selectedMainImage ? 
                          'outline outline-4 outline-blue-500 shadow-lg scale-105 z-20' : 
                          'border border-gray-200'
                        }`}
                        onClick={() => {
                          console.log('이미지 클릭됨, index:', index);
                          console.log('현재 uploadedImages 전체:', uploadedImages);
                          console.log('현재 클릭한 이미지 인덱스의 내용:', uploadedImages[index]);
                          
                          // 이미지 데이터가 있는지 명확하게 체크
                          if (uploadedImages[index] && uploadedImages[index].id) {
                            const imageId = uploadedImages[index].id;
                            console.log(`이미지 ID ${imageId}를 대표 이미지로 설정합니다.`);
                            
                            // 상태 업데이트 (UI 즉시 반영)
                            setSelectedMainImage(imageId);
                            
                            // API 호출
                            handleSetMainImage(imageId);
                          } else {
                            console.log('업로드된 이미지 정보가 없거나 ID가 없음, index:', index);
                            console.log('디버깅용 정보:');
                            console.log('- profileImages 길이:', profileImages.length);
                            console.log('- imageFiles 길이:', imageFiles.length);
                            console.log('- uploadedImages 길이:', uploadedImages.length);
                            console.log('- uploadedImages 내용:', JSON.stringify(uploadedImages));
                          }
                        }}>
                        <img 
                          src={profileImages[index]}
                          alt={`프로필 사진 ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {uploadedImages[index] && uploadedImages[index].id === selectedMainImage && (
                          <div className="absolute top-0 left-0 w-full h-full">
                            <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm z-30">
                              대표
                            </span>
                          </div>
                        )}
                        {uploadedImages[index] && uploadedImages[index].id !== selectedMainImage && (
                          <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-sm font-medium bg-blue-600 px-3 py-1.5 rounded shadow-sm">대표 이미지로 설정</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10"
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
              <p className="text-sm text-blue-600 font-medium">
                업로드한 사진을 클릭하면 <span className="font-bold underline">대표 이미지</span>로 선택되며 파란색 테두리로 표시됩니다.
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
              {imageErrors && (
                <p className="text-red-500">• {imageErrors}</p>
              )}
              {uploadedImages.length < 3 && (
                <p className="text-red-500">• 프로필 사진 3장을 모두 업로드해주세요</p>
              )}
              {!selectedMainImage && uploadedImages.length >= 3 && (
                <p className="text-red-500">• 대표 이미지를 선택해주세요</p>
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
               홈으로 이동합니다
            </p>
          </div>
        </div>
      )}

    </div>
  );
}