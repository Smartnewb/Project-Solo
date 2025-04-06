"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/utils/supabase";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// 개인정보 동의 모달 컴포넌트
function PrivacyPolicyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
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
                <p>
                  성명, 인스타그램 계정 아이디, 성별, 학과, 학번, 휴대전화 번호,
                  개인 신상 정보 및 기타 정보
                </p>
              </div>
              <div>
                <p className="font-semibold">3. 보유 및 이용 기간</p>
                <p>2025년 12월 31일까지</p>
              </div>
              <div>
                <p className="font-semibold">4. 동의 거부권 및 불이익</p>
                <p>
                  귀하는 "한밭대의 모든 것"의 블라인드 서비스 신청에 필요한
                  최소한의 개인정보 수집, 이용에 동의하지 않으실 경우, 서비스
                  사용 불가 등의 불이익이 발생하게 됩니다.
                </p>
              </div>
              <p className="font-medium">
                수집 근거: 개인정보 보호법 제15조 제1항
              </p>
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
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    age: "",
    gender: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignupEnabled, setIsSignupEnabled] = useState<boolean>(true);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [locationAgreed, setLocationAgreed] = useState(false);
  const [sensitiveAgreed, setSensitiveAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [allAgreed, setAllAgreed] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // 회원가입 상태 확인
    const checkSignupStatus = async () => {
      try {
        const response = await fetch("/api/admin/signup-control");
        const data = await response.json();
        setIsSignupEnabled(data.isSignupEnabled);
      } catch (error) {
        console.error("회원가입 상태 확인 실패:", error);
        setIsSignupEnabled(false);
      }
    };

    checkSignupStatus();
  }, []);

  // 이메일 검증 함수 추가
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // handleChange 함수 수정
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 이메일 필드 변경 시 검증
    if (name === "email" && value) {
      if (!validateEmail(value)) {
        setError("올바른 이메일 형식이 아닙니다.");
      } else {
        setError(null);
      }
    }
  };

  const handleSendVerification = async () => {
    if (!formData.email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        throw new Error("인증 코드 전송에 실패했습니다.");
      }

      setShowVerificationInput(true);
      setError(null);
    } catch (err) {
      setError("인증 코드 전송 중 오류가 발생했습니다.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setVerificationError("인증 코드를 입력해주세요.");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error("잘못된 인증 코드입니다.");
      }

      setEmailVerified(true);
      setVerificationError(null);
    } catch (err) {
      setVerificationError("인증에 실패했습니다. 코드를 다시 확인해주세요.");
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
      setError(
        "현재 매칭이 진행 중이라 신규 회원가입을 받지 않고 있습니다. 다음 매칭 시간에 다시 시도해주세요."
      );
      return;
    }

    console.log("회원가입 시도:", { data: formData });
    setError(null);
    setLoading(true);

    // 입력값 검증
    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.age ||
      !formData.gender
    ) {
      setError("모든 필드를 입력해주세요.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      // 1. 이메일 중복 확인
      const checkEmailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/check/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: formData.email }),
        }
      );

      if (!checkEmailResponse.ok) {
        const errorData = await checkEmailResponse.json();
        throw new Error(errorData.message || "이미 사용 중인 이메일입니다.");
      }

      // 2. 회원가입 요청 비밀번호에 특수문자 포함
      const signupData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender as "MALE" | "FEMALE",
      };

      console.log("회원가입 요청 데이터:", signupData);

      const signupResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signupData),
        }
      );

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        console.error("회원가입 실패 응답:", {
          status: signupResponse.status,
          statusText: signupResponse.statusText,
          error: errorData,
        });

        // HTTP 상태 코드에 따른 에러 메시지 처리
        let errorMessage;
        switch (signupResponse.status) {
          case 409:
            errorMessage = "이미 등록된 이메일입니다.";
            break;
          case 400:
            errorMessage =
              "비밀번호는 특수문자가 포함된 8자리 이상이어야 합니다.";
            break;
          default:
            errorMessage =
              errorData.message || "회원가입 처리 중 오류가 발생했습니다.";
        }

        throw new Error(errorMessage);
      }

      // 회원가입 성공 메시지 표시
      alert("회원가입에 성공했습니다.");

      // 3. 회원가입 성공 시 로그인 페이지로 이동
      router.push("/onboarding");
    } catch (err) {
      console.error("회원가입 중 오류:", err);
      setError(
        err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 전체 동의 처리
  const handleAllAgree = (checked: boolean) => {
    setAllAgreed(checked);
    setPrivacyAgreed(checked);
    setTermsAgreed(checked);
    setLocationAgreed(checked);
    setSensitiveAgreed(checked);
    setMarketingAgreed(checked);
  };

  // 개별 동의 상태 변경 시 전체 동의 상태 체크
  useEffect(() => {
    const allChecked = 
      privacyAgreed && 
      termsAgreed && 
      locationAgreed && 
      sensitiveAgreed && 
      marketingAgreed;
    
    setAllAgreed(allChecked);
  }, [privacyAgreed, termsAgreed, locationAgreed, sensitiveAgreed, marketingAgreed]);

  // 필수 약관 동의 확인
  const requiredAgreementsChecked = 
    privacyAgreed && 
    termsAgreed && 
    locationAgreed && 
    sensitiveAgreed;

  const handleAgreementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiredAgreementsChecked) {
      setShowSignupForm(true);
    }
  };

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
              <h1 className="text-h2 ml-2 mt-3">회원가입</h1>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4">
          <div className="card p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-red-600">
              회원가입 일시 중단
            </h2>
            <p className="text-gray-600">
              현재 매칭이 진행 중이라 신규 회원가입을 받지 않고 있습니다.
              <br />
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

  if (!showSignupForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center">
              <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <h1 className="text-h2 ml-2 mt-3">이용약관 동의</h1>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4">
          <form onSubmit={handleAgreementSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              {/* 전체 동의 */}
              <div className="flex items-center justify-between p-4 border-2 border-pink-200 rounded-lg bg-pink-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="all"
                    checked={allAgreed}
                    onChange={(e) => handleAllAgree(e.target.checked)}
                    className="h-5 w-5 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                  />
                  <label htmlFor="all" className="text-base font-medium text-gray-700">
                    전체 동의
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                {/* 개인정보 수집 및 이용 동의 */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      className="h-5 w-5 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                      required
                    />
                    <div>
                      <label htmlFor="privacy" className="text-sm text-gray-600">
                        개인정보 수집 및 이용 동의
                      </label>
                      <span className="ml-2 text-xs text-pink-500">(필수)</span>
                    </div>
                  </div>
                  <a
                    href="https://ruby-composer-6d2.notion.site/1cd1bbec5ba180a3a4bbdf9301683145?pvs=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink-500 hover:text-pink-600"
                  >
                    보기
                  </a>
                </div>

                {/* 서비스 이용약관 */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="h-5 w-5 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                      required
                    />
                    <div>
                      <label htmlFor="terms" className="text-sm text-gray-600">
                        서비스 이용약관 동의
                      </label>
                      <span className="ml-2 text-xs text-pink-500">(필수)</span>
                    </div>
                  </div>
                  <a
                    href="https://ruby-composer-6d2.notion.site/1cd1bbec5ba1805dbafbc9426a0aaa80?pvs=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink-500 hover:text-pink-600"
                  >
                    보기
                  </a>
                </div>

                {/* 위치정보 이용약관 */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="location"
                      checked={locationAgreed}
                      onChange={(e) => setLocationAgreed(e.target.checked)}
                      className="h-5 w-5 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                      required
                    />
                    <div>
                      <label htmlFor="location" className="text-sm text-gray-600">
                        위치정보 이용약관 동의
                      </label>
                      <span className="ml-2 text-xs text-pink-500">(필수)</span>
                    </div>
                  </div>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink-500 hover:text-pink-600"
                  >
                    보기
                  </a>
                </div>

                {/* 민감정보 이용 동의 */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sensitive"
                      checked={sensitiveAgreed}
                      onChange={(e) => setSensitiveAgreed(e.target.checked)}
                      className="h-5 w-5 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                      required
                    />
                    <div>
                      <label htmlFor="sensitive" className="text-sm text-gray-600">
                        민감정보 이용 동의
                      </label>
                      <span className="ml-2 text-xs text-pink-500">(필수)</span>
                    </div>
                  </div>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink-500 hover:text-pink-600"
                  >
                    보기
                  </a>
                </div>

                {/* 마케팅 수신 동의 */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={marketingAgreed}
                      onChange={(e) => setMarketingAgreed(e.target.checked)}
                      className="h-5 w-5 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="marketing" className="text-sm text-gray-600">
                        마케팅 수신 동의
                      </label>
                      <span className="ml-2 text-xs text-gray-500">(선택)</span>
                    </div>
                  </div>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink-500 hover:text-pink-600"
                  >
                    보기
                  </a>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 ${
                  requiredAgreementsChecked
                    ? "bg-pink-500 hover:bg-pink-600"
                    : "bg-gray-400 cursor-not-allowed"
                } text-white font-medium rounded-md transition duration-200 text-lg`}
                disabled={!requiredAgreementsChecked}
              >
                다음
              </button>
            </div>
          </form>
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
              <h1 className="text-h2 ml-2 mt-3">회원가입</h1>
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
                    className={`input-field flex-1 ${
                      formData.email && !validateEmail(formData.email)
                        ? "border-red-300 focus:border-red-500"
                        : ""
                    }`}
                    placeholder="example@email.com"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={
                      sendingEmail ||
                      emailVerified ||
                      (formData.email ? !validateEmail(formData.email) : false)
                    }
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      emailVerified
                        ? "bg-green-500 text-white cursor-not-allowed"
                        : sendingEmail
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : formData.email && !validateEmail(formData.email)
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {emailVerified
                      ? "인증완료"
                      : sendingEmail
                      ? "전송중..."
                      : "인증하기"}
                  </button>
                </div>
                {formData.email && !validateEmail(formData.email) && (
                  <p className="text-red-500 text-sm mt-1">
                    올바른 이메일 형식이 아닙니다.
                  </p>
                )}
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
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                    >
                      {verifying ? "확인중..." : "확인"}
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
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className={`w-full py-3 px-4 ${
                requiredAgreementsChecked
                  ? "bg-pink-500 hover:bg-pink-600"
                  : "bg-gray-400 cursor-not-allowed"
              } text-white font-medium rounded-md transition duration-200 text-lg`}
              disabled={loading || !requiredAgreementsChecked}
            >
              {loading ? "가입 중..." : "가입하기"}
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              이미 계정이 있으신가요? 로그인하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
