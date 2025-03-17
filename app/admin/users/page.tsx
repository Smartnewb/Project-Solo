'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type User = {
  id: string;
  user_id: string;
  name: string;
  age: number;
  gender: string;
  created_at: string;
  updated_at: string;
  email?: string;
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      
      // 1. 프로필 목록 조회
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        throw profilesError;
      }
      
      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // 2. 이메일 정보 가져오기 (관리자만 볼 수 있음)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser?.email === 'notify@smartnewb.com') {
        // 관리자인 경우 사용자 이메일 정보 조회
        const userIds = profilesData.map(profile => profile.user_id);
        
        // 이메일 정보 가져오기 (실제로는 추가 권한 필요)
        const { data: authUsers, error: authError } = await supabase
          .rpc('get_users_email', { user_ids: userIds });
        
        if (!authError && authUsers) {
          // 프로필 정보와 이메일 정보 합치기
          const usersWithEmail = profilesData.map(profile => {
            const userEmail = authUsers.find((user: any) => user.id === profile.user_id);
            return {
              ...profile,
              email: userEmail?.email || '이메일 없음'
            };
          });
          
          setUsers(usersWithEmail);
        } else {
          // 이메일 정보를 가져오지 못한 경우
          console.warn('이메일 정보를 가져오지 못했습니다:', authError);
          setUsers(profilesData);
        }
      } else {
        // 일반 사용자인 경우 프로필 정보만 표시
        setUsers(profilesData);
      }
    } catch (err: any) {
      console.error('사용자 목록 불러오기 오류:', err);
      setError(err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleCloseDetails = () => {
    setSelectedUser(null);
  };

  const formatDateKorean = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-DEFAULT mx-auto"></div>
        <p className="mt-4 text-gray-600">사용자 목록 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">사용자 관리</h1>
      
      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-8">등록된 사용자가 없습니다.</p>
      ) : (
        <>
          <div className="bg-white p-4 rounded shadow mb-6">
            <p className="text-gray-700">총 {users.length}명의 사용자가 등록되어 있습니다.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">ID</th>
                  <th className="py-2 px-4 border">이름</th>
                  <th className="py-2 px-4 border">나이</th>
                  <th className="py-2 px-4 border">성별</th>
                  <th className="py-2 px-4 border">가입일</th>
                  <th className="py-2 px-4 border">관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border">{user.user_id.slice(0, 8)}...</td>
                    <td className="py-2 px-4 border">{user.name || '이름 없음'}</td>
                    <td className="py-2 px-4 border">{user.age || '-'}</td>
                    <td className="py-2 px-4 border">
                      {user.gender === 'male' ? '남성' : 
                       user.gender === 'female' ? '여성' : '기타'}
                    </td>
                    <td className="py-2 px-4 border">
                      {formatDateKorean(user.created_at)}
                    </td>
                    <td className="py-2 px-4 border">
                      <button
                        onClick={() => handleUserSelect(user)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        상세정보
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 사용자 상세 정보 모달 */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">사용자 상세 정보</h2>
                  <button 
                    onClick={handleCloseDetails}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">이름</p>
                    <p className="font-medium">{selectedUser.name || '이름 없음'}</p>
                  </div>
                  
                  {selectedUser.email && (
                    <div>
                      <p className="text-sm text-gray-500">이메일</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">나이</p>
                    <p className="font-medium">{selectedUser.age || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">성별</p>
                    <p className="font-medium">
                      {selectedUser.gender === 'male' ? '남성' : 
                       selectedUser.gender === 'female' ? '여성' : '기타'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">사용자 ID</p>
                    <p className="font-medium truncate">{selectedUser.user_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">가입일</p>
                    <p className="font-medium">{formatDateKorean(selectedUser.created_at)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">최근 업데이트</p>
                    <p className="font-medium">{formatDateKorean(selectedUser.updated_at)}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCloseDetails}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 