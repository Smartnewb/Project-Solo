'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// Simple Loader component
const Loader = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
  </div>
);

// 프로필 데이터 인터페이스 정의
interface ProfileData {
  university: string;
  department: string;
  student_id: string;
  height: number;
  name: string;
  email: string;
  nickname: string;
  bio: string;
  avatar_url: string;
  phone: string;
  gender: string;
  age: number;
  creation_date: string;
  last_login: string;
  interests: string[];
  instagram_id: string;
  mbti: string;
  personalities: string[];
  dating_styles: string[];
  ideal_lifestyles: string[];
  drinking: string;
  smoking: string;
  tattoo: string;
  grade: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [profileData, setProfileData] = useState<ProfileData>({
    university: '',
    department: '',
    student_id: '',
    height: 0,
    name: '',
    email: '',
    nickname: '',
    bio: '',
    avatar_url: '',
    phone: '',
    gender: '',
    age: 0,
    creation_date: '',
    last_login: '',
    interests: [],
    instagram_id: '',
    mbti: '',
    personalities: [],
    dating_styles: [],
    ideal_lifestyles: [],
    drinking: '',
    smoking: '',
    tattoo: '',
    grade: ''
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfileData() {
      try {
        setLoading(true);
        
        // 현재 로그인된 사용자의 ID 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('사용자 인증 정보가 없습니다.');
          router.push('/login');
          return;
        }
        
        // 프로필 정보 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (profileError) {
          console.error('프로필 정보 조회 오류:', profileError);
        } else {
          console.log('=== 프로필 데이터 ===');
          console.log(JSON.stringify(profileData, null, 2));
          
          // 프로필 데이터 설정
          setProfileData({
            university: profileData?.university || '',
            department: profileData?.department || '',
            student_id: profileData?.student_id || '',
            height: profileData?.height || 0,
            name: profileData?.name || '',
            email: user?.email || '',
            nickname: profileData?.nickname || '',
            bio: profileData?.bio || '',
            avatar_url: profileData?.avatar_url || '',
            phone: profileData?.phone || '',
            gender: profileData?.gender || '',
            age: profileData?.age || 0,
            creation_date: user?.created_at || '',
            last_login: user?.last_sign_in_at || '',
            interests: profileData?.interests || [], // Added missing interests field
            instagram_id: profileData?.instagram_id || '',
            mbti: profileData?.mbti || '',
            personalities: profileData?.personalities || [],
            dating_styles: profileData?.dating_styles || [],
            ideal_lifestyles: profileData?.ideal_lifestyles || [],
            drinking: profileData?.drinking || '',
            smoking: profileData?.smoking || '',
            tattoo: profileData?.tattoo || '',
            grade: profileData?.grade || ''
          });
        }

        // 이상형 선호도 정보 가져오기
        const { data: preferenceData, error: preferenceError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (preferenceError && preferenceError.code !== 'PGRST116') {
          console.error('이상형 선호도 정보 조회 오류:', preferenceError);
        } else if (preferenceData) {
          console.log('=== 이상형 선호도 데이터 ===');
          console.log(JSON.stringify(preferenceData, null, 2));
        } else {
          console.log('=== 저장된 이상형 선호도 데이터 없음 ===');
        }

      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getProfileData();
  }, [supabase, router]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-all"
            aria-label="뒤로 가기"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">내 프로필</h1>
        </div>

        <div className="space-y-6">
          {/* 프로필 헤더 섹션 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-bold">기본 정보</h2>
            </div>

            {/* 프로필 사진 및 기본 정보 */}
            <div className="flex items-center gap-6 mb-6">
              <div className="w-28 h-28 rounded-full bg-gray-300 overflow-hidden shadow-md">
                {profileData.avatar_url ? (
                  <img 
                    src={profileData.avatar_url} 
                    alt="프로필 사진"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profileData.name || '이름 미설정'}</h2>
                <p className="text-gray-600">{profileData.email || '이메일 미설정'}</p>
                {profileData.nickname && <p className="text-gray-600">닉네임: {profileData.nickname}</p>}
                {profileData.phone && <p className="text-gray-600">연락처: {profileData.phone}</p>}
                {profileData.instagram_id && <p className="text-gray-600">인스타그램: {profileData.instagram_id}</p>}
              </div>
            </div>

            {/* 자기소개 */}
            {profileData.bio && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">자기소개</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-xl whitespace-pre-line">{profileData.bio}</p>
              </div>
            )}
          </div>

          {/* 개인 정보 섹션 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">개인 정보</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">성별</p>
                <p className="font-medium">{profileData.gender || '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">나이</p>
                <p className="font-medium">{profileData.age || '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">키</p>
                <p className="font-medium">{profileData.height ? `${profileData.height}cm` : '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">MBTI</p>
                <p className="font-medium">{profileData.mbti || '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">가입일</p>
                <p className="font-medium">{profileData.creation_date ? new Date(profileData.creation_date).toLocaleDateString() : '미설정'}</p>
              </div>
            </div>
          </div>

          {/* 학교 정보 섹션 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">학교 정보</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">대학교</p>
                <p className="font-medium">{profileData.university || '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">학과</p>
                <p className="font-medium">{profileData.department || '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">학번</p>
                <p className="font-medium">{profileData.student_id || '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">학년</p>
                <p className="font-medium">{profileData.grade || '미설정'}</p>
              </div>
            </div>
          </div>

          {/* 성격 및 연애 스타일 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">성격 및 연애 스타일</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">성격</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.personalities && profileData.personalities.length > 0 ? (
                    profileData.personalities.map((item, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 border border-purple-300 rounded-xl">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">미설정</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">연애 스타일</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.dating_styles && profileData.dating_styles.length > 0 ? (
                    profileData.dating_styles.map((item, index) => (
                      <span key={index} className="px-3 py-1 bg-pink-100 text-pink-800 border border-pink-300 rounded-xl">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">미설정</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">이상적인 라이프스타일</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.ideal_lifestyles && profileData.ideal_lifestyles.length > 0 ? (
                    profileData.ideal_lifestyles.map((item, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-xl">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">미설정</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 관심사 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">관심사</h2>
            <div className="flex flex-wrap gap-2">
              {profileData.interests && profileData.interests.length > 0 ? (
                profileData.interests.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 border border-green-300 rounded-xl">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">미설정</span>
              )}
            </div>
          </div>

          {/* 선호도 정보 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">선호도 정보</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">음주</p>
                <p className="font-medium">{profileData.drinking || '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">흡연</p>
                <p className="font-medium">{profileData.smoking || '미설정'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm">타투</p>
                <p className="font-medium">{profileData.tattoo || '미설정'}</p>
              </div>
            </div>
          </div>

          {/* 이상형 설정 버튼 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">이상형 설정</h2>
              <button
                onClick={() => router.push('/settings/ideal-type')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                이상형 설정하기
              </button>
            </div>
            <p className="text-gray-600 mt-2">
              성격, 연애 스타일, 라이프스타일 등 나의 이상형을 설정해보세요.
            </p>
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/settings')}
              className="w-full py-3 px-6 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-all"
            >
              돌아가기
            </button>
            
            <button
              onClick={() => router.push('/profile')}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              프로필 수정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 