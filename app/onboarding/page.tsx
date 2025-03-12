'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OnboardingForm {
  name: string;
  university: string;
  studentId: string;
  grade: string;
  image: string;
  bio: string;
}

interface ValidationErrors {
  name: boolean;
  university: boolean;
  studentId: boolean;
  grade: boolean;
  image: boolean;
  bio: boolean;
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingForm>({
    name: '',
    university: '',
    studentId: '',
    grade: '',
    image: '',
    bio: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({
    name: false,
    university: false,
    studentId: false,
    grade: false,
    image: false,
    bio: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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
  ];

  const studentIds = Array.from({ length: 9 }, (_, i) => `${i + 17}학번`);
  const grades = Array.from({ length: 5 }, (_, i) => `${i + 1}학년`);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: !formData.name,
      university: !formData.university,
      studentId: !formData.studentId,
      grade: !formData.grade,
      image: !formData.image,
      bio: !formData.bio,
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
      localStorage.setItem('onboardingProfile', JSON.stringify(formData));
      router.push('/profile');
    } catch (error) {
      console.error('프로필 저장 에러:', error);
      showTemporaryModal('프로필 정보 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4">
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
          <div className={`card space-y-4 ${errors.university || errors.studentId || errors.grade ? 'border-2 border-red-500' : ''}`}>
            <h2 className="text-h2">학교 정보</h2>
            <div className="space-y-4">
              <select
                value={formData.university}
                onChange={(e) => {
                  setFormData({ ...formData, university: e.target.value });
                  setErrors({ ...errors, university: false });
                }}
                className={`input-field ${formData.university ? 'border-[#4A90E2]' : ''}`}
                required
              >
                <option value="">대학교 선택 (필수)</option>
                {universities.map((univ) => (
                  <option key={univ} value={univ}>{univ}</option>
                ))}
              </select>

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

          {/* 자기소개 */}
          <div className={`card space-y-4 ${errors.bio ? 'border-2 border-red-500' : ''}`}>
            <h2 className="text-h2">자기소개</h2>
            <div>
              <textarea
                value={formData.bio}
                onChange={(e) => {
                  setFormData({ ...formData, bio: e.target.value });
                  setErrors({ ...errors, bio: false });
                }}
                placeholder="자신을 자유롭게 소개해주세요! (필수)"
                className="input-field"
                rows={4}
                maxLength={200}
                required
              />
              <p className="mt-1 text-sm text-gray-500 text-right">
                {formData.bio.length}/200
              </p>
            </div>
          </div>

          {/* 다음 버튼 */}
          <button type="submit" className="btn-primary w-full">
            다음
          </button>
        </form>
      </div>

      {/* 알림 모달 */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-50 absolute inset-0"></div>
          <div className="bg-white rounded-lg p-6 shadow-xl z-10 transform transition-all">
            <p className="text-lg font-medium text-center text-gray-800">
              {modalMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 