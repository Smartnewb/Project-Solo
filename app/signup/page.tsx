'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/utils/supabase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// 개인정보 동의 모달 컴포넌트
function PrivacyPolicyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">개인정보 수집 및 이용 동의</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-gray-600">
              <p className="font-medium">
                "한밭대의 모든 것"은 블라인드 소개팅 서비스 신청을 받기 위해
                아래와 같이 개인정보를 수집, 이용합니다.
              </p>
              <div>
                <p className="font-semibold">1. 수집, 이용 목적</p>
                <p>블라인드 소개팅 신청자 정보 관리 및 연락 수단</p>
              </div>
              <div>
                <p className="font-semibold">2. 수집하는 개인정보의 항목</p>
                <p>성명, 인스타그램 계정 아이디, 성별, 학과, 학번, 휴대전화 번호, 개인 신상 정보 및 기타 정보</p>
              </div>
              <div>
                <p className="font-semibold">3. 보유 및 이용 기간</p>
                <p>2025년 12월 31일까지</p>
              </div>
              <div>
                <p className="font-semibold">4. 동의 거부권 및 불이익</p>
                <p>귀하는 "한밭대의 모든 것"의 블라인드 서비스 신청에 필요한 최소한의 개인정보 수집, 이용에 동의하지 않으실 경우, 서비스 사용 불가 등의 불이익이 발생하게 됩니다.</p>
              </div>
              <p className="font-medium">수집 근거: 개인정보 보호법 제15조 제1항</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SignUp() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    gender: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignupEnabled, setIsSignupEnabled] = useState<boolean | null>(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true); // 이거 임시로 true로 설정, false로 설정해둬야함 ( 테스트용)
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // 회원가입 상태 확인
    const checkSignupStatus = async () => {
      try {
        const response = await fetch('/api/admin/signup-control');
        const data = await response.json();
        setIsSignupEnabled(data.isSignupEnabled);
      } catch (error) {
        console.error('회원가입 상태 확인 실패:', error);
        setIsSignupEnabled(false);
      }
    };

    checkSignupStatus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSendVerification = async () => {
    if (!formData.email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      if (!response.ok) {
        throw new Error('인증 코드 전송에 실패했습니다.');
      }

      setShowVerificationInput(true);
      setError(null);
    } catch (err) {
      setError('인증 코드 전송 중 오류가 발생했습니다.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setVerificationError('인증 코드를 입력해주세요.');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode
        })
      });

      if (!response.ok) {
        throw new Error('잘못된 인증 코드입니다.');
      }

      setEmailVerified(true);
      setVerificationError(null);
    } catch (err) {
      setVerificationError('인증에 실패했습니다. 코드를 다시 확인해주세요.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 이메일 인증 체크 임시 비활성화 테스트용
    // if (!emailVerified) {
    //   setError('이메일 인증이 필요합니다.');
    //   return;
    // }

    // 회원가입이 비활성화된 경우
    if (!isSignupEnabled) {
      setError('현재 매칭이 진행 중이라 신규 회원가입을 받지 않고 있습니다. 다음 매칭 시간에 다시 시도해주세요.');
      return;
    }

    console.log('회원가입 시도:', { data: formData });
    setError(null);
    setLoading(true);

    // 입력값 검증
    if (!formData.email || !formData.password || !formData.name || !formData.age || !formData.gender) {
      setError('모든 필드를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // 1. 회원가입 시도
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender
          }
        }
      });

      if (signUpError) {
        console.error('회원가입 에러:', signUpError);
        if (signUpError.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (!signUpData.user) {
        setError('회원가입 처리 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      // 2. profiles 테이블에 사용자 정보 저장
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: signUpData.user.id,
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          role: 'user'
        });

      if (profileError) {
        console.error('프로필 생성 에러:', profileError);
        setError('프로필 생성 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      // 3. 자동 로그인 처리
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        console.error('로그인 에러:', loginError);
        setError('회원가입 후 로그인 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      // 4. 온보딩 페이지로 이동
      router.push('/onboarding');

    } catch (err) {
      console.error('예상치 못한 에러:', err);
      setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 상태 로딩 중
  if (isSignupEnabled === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-DEFAULT mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 회원가입이 비활성화된 경우
  if (!isSignupEnabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center">
              <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <h1 className="text-h2 ml-2">회원가입</h1>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4">
          <div className="card p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-red-600">회원가입 일시 중단</h2>
            <p className="text-gray-600">
              현재 매칭이 진행 중이라 신규 회원가입을 받지 않고 있습니다.<br />
              다음 매칭 시간에 다시 시도해주세요.
            </p>
            <Link href="/" className="btn-primary inline-block">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center">
              <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <h1 className="text-h2 ml-2">회원가입</h1>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="card space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field flex-1"
                    //disabled={emailVerified} 테스트용 주석처리
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={sendingEmail || emailVerified}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      emailVerified
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : sendingEmail
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {emailVerified ? '인증완료' : sendingEmail ? '전송중...' : '인증하기'}
                  </button>
                </div>
              </div>

              {showVerificationInput && !emailVerified && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    인증 코드
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="input-field flex-1"
                      placeholder="인증 코드 6자리를 입력하세요"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifying || !verificationCode}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        verifying
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white`}
                    >
                      {verifying ? '확인중...' : '확인'}
                    </button>
                  </div>
                  {verificationError && (
                    <p className="text-red-500 text-sm">{verificationError}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  나이
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  성별
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">선택해주세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>

            {/* 개인정보 동의 체크박스 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                className="h-4 w-4 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                required
              />
              <label htmlFor="privacy" className="text-sm text-gray-600">
                개인정보 수집 및 이용에 동의합니다.
              </label>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-sm text-pink-500 hover:text-pink-600 underline"
              >
                상세보기
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className={`w-full py-3 px-4 ${
                privacyAgreed 
                  ? 'bg-pink-500 hover:bg-pink-600' 
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white font-medium rounded-md transition duration-200 text-lg`}
              disabled={loading || !privacyAgreed}
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              이미 계정이 있으신가요? 로그인하기
            </Link>
          </div>
        </div>
      </div>

      {/* 개인정보 동의 모달 */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}