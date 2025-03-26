'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

// 환경 변수에서 관리자 이메일 가져오기
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'notify@smartnewb.com';

// 프로필 타입 정의
export type Profile = {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  email?: string;
  name?: string;
  age?: number;
  gender?: string;
  is_admin?: boolean;
  role?: string;
  classification?: string;
  student_id?: string;
  avatar_url?: string;
  university?: string;
  department?: string;
  grade?: string;
  instagram_id?: string;
  personalities?: string[];
  dating_styles?: string[];
  lifestyles?: string[];
  interests?: string[];
  drinking?: string;
  smoking?: string;
  tattoo?: string;
  height?: number;
  ideal_lifestyles?: string[];
  mbti?: string;
  [key: string]: any; // 인덱스 시그니처 추가
};

// 인증 컨텍스트 타입 정의
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  hasCompletedProfile: boolean;
  hasCompletedIdealType: boolean;
  updateProfile: (profile: Profile) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  needsOnboarding: boolean;
  refreshProfile: () => Promise<void>;
}

// 기본값으로 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  hasCompletedOnboarding: false,
  hasCompletedProfile: false,
  hasCompletedIdealType: false,
  updateProfile: async () => {},
  signOut: async () => {},
  isAdmin: false,
  needsOnboarding: false,
  refreshProfile: async () => {},
});

// 인증 컨텍스트 사용을 위한 훅
export const useAuth = () => useContext(AuthContext);

// 인증 상태를 관리하는 프로바이더 컴포넌트
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasCompletedIdealType, setHasCompletedIdealType] = useState(false);

  // 프로필 완성도 체크 함수
  const checkProfileCompletion = (profile: Profile | null) => {
    if (!profile) return false;
    
    const requiredFields = ['height', 'personalities', 'university', 'department', 'student_id', 'instagram_id'];
    return requiredFields.every(field => profile[field]);
  };

  // 이상형 정보 완성도 체크 함수
  const checkIdealTypeCompletion = (profile: Profile | null) => {
    if (!profile) return false;
    
    const idealTypeFields = ['dating_styles', 'lifestyles', 'interests'];
    return idealTypeFields.every(field => 
      profile[field] && Array.isArray(profile[field]) && profile[field].length > 0
    );
  };

  // 프로필 정보 가져오기
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('fetchProfile 호출됨, 조회할 사용자 ID:', userId);
      
      if (!userId) {
        console.error('fetchProfile: 유효하지 않은 사용자 ID');
        setProfile(null);
        setNeedsOnboarding(true);
        return null;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('프로필 조회 오류:', error);
        setProfile(null);
        setNeedsOnboarding(true);
        localStorage.removeItem('profile');
        return null;
      }
      
      if (data) {
        console.log('프로필 조회 성공:', data);
        
        // 필수 필드가 있는지 확인
        const requiredFields = ['university', 'department', 'student_id', 'grade', 'instagram_id'];
        const needsOnboarding = requiredFields.some(field => !data[field]);
        
        setNeedsOnboarding(needsOnboarding);
        
        if (needsOnboarding) {
          console.log('필수 필드 누락, 온보딩 필요:', 
            requiredFields.filter(field => !data[field]));
        } else {
          console.log('온보딩 완료 상태');
        }
        
        try {
          localStorage.setItem('profile', JSON.stringify(data));
        } catch (e) {
          console.error('프로필 localStorage 저장 오류:', e);
        }
        
        setProfile(data);
        setHasCompletedProfile(checkProfileCompletion(data));
        setHasCompletedIdealType(checkIdealTypeCompletion(data));
        return data;
      } else {
        console.log('프로필 데이터 없음, null 반환');
        setProfile(null);
        setNeedsOnboarding(true);
        localStorage.removeItem('profile');
        return null;
      }
    } catch (e) {
      console.error('fetchProfile 예외 발생:', e);
      setProfile(null);
      setNeedsOnboarding(true);
      localStorage.removeItem('profile');
      return null;
    }
  };

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // 로그아웃 처리
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // 로컬 스토리지 클리어
      try {
        localStorage.removeItem('profile');
      } catch (storageError) {
        console.error('로컬 스토리지 클리어 오류:', storageError);
      }
      
      router.push('/');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 인증 상태 설정
  const initAuth = async () => {
    try {
      console.log('인증 상태 초기화 중...');
      setLoading(true);
      
      // 세션 가져오기
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('세션 상태:', currentSession ? '세션 있음' : '세션 없음');
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setIsAdmin(currentSession.user.email === ADMIN_EMAIL);
        
        // 로컬 스토리지에서 프로필 확인
        const cachedProfile = localStorage.getItem('profile');
        if (cachedProfile) {
          const parsedProfile = JSON.parse(cachedProfile);
          setProfile(parsedProfile);
          setHasCompletedProfile(checkProfileCompletion(parsedProfile));
          setHasCompletedIdealType(checkIdealTypeCompletion(parsedProfile));
          setLoading(false);
          
          // 백그라운드에서 프로필 새로고침
          fetchProfile(currentSession.user.id).catch(console.error);
        } else {
          // 캐시된 프로필이 없는 경우에만 서버에서 조회
          await fetchProfile(currentSession.user.id);
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setNeedsOnboarding(false);
        setLoading(false);
        localStorage.removeItem('profile');
      }
    } catch (error) {
      console.error('인증 초기화 중 오류:', error);
      setLoading(false);
    }
  };

  // 인증 상태 변경 감지
  useEffect(() => {
    console.log('AuthContext 마운트, 인증 초기화');
    initAuth();
    
    // Session 타입 명시
    let lastKnownSession: Session | null = null;
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변경:', event, session ? '세션 있음' : '세션 없음');
        
        // 세션이 실제로 변경된 경우에만 처리
        if (JSON.stringify(session) !== JSON.stringify(lastKnownSession)) {
          lastKnownSession = session;
          
          if (session) {
            setSession(session);
            setUser(session.user);
            setIsAdmin(session.user.email === ADMIN_EMAIL);
            
            // 로그인 또는 토큰 갱신 시에만 프로필 새로고침
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              await fetchProfile(session.user.id);
            }
          } else {
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            setNeedsOnboarding(false);
            localStorage.removeItem('profile');
          }
        }
        
        setLoading(false);
      }
    );
    
    return () => {
      console.log('AuthContext 언마운트, 구독 해제');
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  // 컨텍스트 값 설정
  const value = {
    user,
    session,
    profile,
    loading,
    hasCompletedOnboarding,
    hasCompletedProfile,
    hasCompletedIdealType,
    updateProfile: async (profile: Profile) => {
      setProfile(profile);
      setHasCompletedProfile(checkProfileCompletion(profile));
      setHasCompletedIdealType(checkIdealTypeCompletion(profile));
    },
    signOut,
    isAdmin,
    needsOnboarding,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 