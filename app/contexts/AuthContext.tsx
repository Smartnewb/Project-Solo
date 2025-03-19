import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClientSupabaseClient } from '@/utils/supabase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Supabase 클라이언트를 메모이제이션
  const supabase = useMemo(() => createClientSupabaseClient(), []);

  // 프로필 조회 함수
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('프로필 조회 오류:', error);
        return null;
      }

      // 프로필이 없는 경우 새로 생성
      if (!profiles || profiles.length === 0) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: userId,
              role: process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL === user?.email ? 'admin' : 'user'
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('프로필 생성 오류:', createError);
          return null;
        }

        return newProfile;
      }

      return profiles[0]; // 첫 번째 프로필 반환
    } catch (error) {
      console.error('프로필 조회 중 예외 발생:', error);
      return null;
    }
  };

  // 관리자 권한 확인 함수
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('관리자 권한 확인 오류:', error);
        return process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL === user?.email;
      }

      if (!profile) {
        return process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL === user?.email;
      }

      return profile.role === 'admin';
    } catch (error) {
      console.error('관리자 권한 확인 중 예외 발생:', error);
      return process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL === user?.email;
    }
  };

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        Promise.all([
          fetchProfile(currentUser.id),
          checkAdminStatus(currentUser.id)
        ]).then(([profileData, adminStatus]) => {
          setProfile(profileData);
          setIsAdmin(adminStatus);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const [profileData, adminStatus] = await Promise.all([
          fetchProfile(currentUser.id),
          checkAdminStatus(currentUser.id)
        ]);
        
        setProfile(profileData);
        setIsAdmin(adminStatus);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const redirectToLogin = () => {
    // 로그인 페이지가 루트에 있으므로 / 경로로 리다이렉트
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 