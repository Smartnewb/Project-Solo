'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type User = {
  id: string;
  user_id: string;
  name: string;
  age?: number;
  gender?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  is_blocked?: boolean;
  reports_count?: number;
  matches_count?: number;
  last_active?: string;
  instagramId?: string;
  classification?: string; // 'S', 'A', 'B', 'C'
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'blocked', 'reported', 'active'
  const [searchTerm, setSearchTerm] = useState<string>('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  async function fetchUsers() {
    try {
      setLoading(true);
      
      // 1. 프로필 목록 조회
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // 필터 적용
      if (filter === 'blocked') {
        query = query.eq('is_blocked', true);
      } else if (filter === 'reported') {
        query = query.gt('reports_count', 0);
      } else if (filter === 'active') {
        // 최근 1주일 내에 활동한 사용자
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gt('last_active', oneWeekAgo.toISOString());
      }
        
      const { data: profilesData, error: profilesError } = await query;
        
      if (profilesError) {
        throw profilesError;
      }
      
      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // 중복 제거 (user_id 기준)
      const uniqueProfiles = Array.from(
        new Map(profilesData.map(profile => [profile.user_id, profile])).values()
      );
      
      console.log('고유 프로필 수:', uniqueProfiles.length);

      // 2. 이메일 정보 가져오기 (관리자만 볼 수 있음)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser?.email === 'notify@smartnewb.com') {
        // 관리자인 경우 사용자 이메일 정보 조회
        const userIds = uniqueProfiles.map(profile => profile.user_id);
        
        // 이메일 정보 가져오기
        const { data: authUsers, error: authError } = await supabase
          .rpc('get_users_email', { user_ids: userIds });
        
        if (!authError && authUsers) {
          // 프로필 정보와 이메일 정보 합치기
          const usersWithEmail = uniqueProfiles.map(profile => {
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
          setUsers(uniqueProfiles);
        }
      } else {
        // 일반 사용자인 경우 프로필 정보만 표시
        setUsers(uniqueProfiles);
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

  const handleBlockUser = async (userId: string) => {
    if (!confirm('이 사용자를 차단하시겠습니까? 차단된 사용자는 로그인할 수 없습니다.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: true })
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      // 목록 업데이트
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, is_blocked: true } : user
      ));
      
      alert('사용자가 차단되었습니다.');
      
    } catch (err: any) {
      console.error('사용자 차단 오류:', err);
      alert('사용자 차단 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!confirm('이 사용자의 차단을 해제하시겠습니까?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: false })
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      // 목록 업데이트
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, is_blocked: false } : user
      ));
      
      alert('사용자 차단이 해제되었습니다.');
      
    } catch (err: any) {
      console.error('사용자 차단 해제 오류:', err);
      alert('사용자 차단 해제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearReports = async (userId: string) => {
    if (!confirm('이 사용자의 신고 내역을 모두 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ reports_count: 0 })
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      // 목록 업데이트
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, reports_count: 0 } : user
      ));
      
      alert('신고 내역이 삭제되었습니다.');
      
    } catch (err: any) {
      console.error('신고 내역 삭제 오류:', err);
      alert('신고 내역 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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

  // 검색어로 필터링된 사용자 목록
  const filteredUsers = searchTerm 
    ? users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const handleClassificationChange = async (userId: string, classification: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ classification })
        .eq('user_id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('분류 업데이트 에러:', error);
      setError('분류 업데이트 중 오류가 발생했습니다.');
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
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
            >
              <option value="all">모든 사용자</option>
              <option value="blocked">차단된 사용자</option>
              <option value="reported">신고된 사용자</option>
              <option value="active">활발한 사용자</option>
            </select>
            
            <div className="relative">
              <input
                type="text"
                placeholder="사용자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={fetchUsers}
              className="bg-primary-DEFAULT hover:bg-primary-dark text-white py-2 px-4 rounded"
              disabled={loading}
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <p className="text-gray-700">총 {filteredUsers.length}명의 사용자가 등록되어 있습니다.</p>
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center">
          <p className="text-gray-500">등록된 사용자가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-3 px-4 text-left">이름</th>
                  <th className="py-3 px-4 text-left">인스타그램</th>
                  <th className="py-3 px-4 text-left">분류</th>
                  <th className="py-3 px-4 text-left">나이/성별</th>
                  <th className="py-3 px-4 text-left">가입일</th>
                  <th className="py-3 px-4 text-left">상태</th>
                  <th className="py-3 px-4 text-left">매칭</th>
                  <th className="py-3 px-4 text-left">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => {
                  const isBlocked = user.is_blocked;
                  const isReported = user.reports_count && user.reports_count > 0;
                  
                  return (
                    <tr key={user.id} className={`hover:bg-gray-50 ${isBlocked ? 'bg-red-50' : isReported ? 'bg-yellow-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className="font-medium">{user.name || '이름 없음'}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.instagramId && (
                          <a
                            href={`https://www.instagram.com/${user.instagramId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {user.instagramId}
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={user.classification || ''}
                          onChange={(e) => handleClassificationChange(user.user_id, e.target.value)}
                          className="input-field"
                        >
                          <option value="">선택</option>
                          <option value="S">S</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        {user.age ? `${user.age}세` : '-'} / {' '}
                        {user.gender === 'male' ? '남성' : 
                         user.gender === 'female' ? '여성' : '기타'}
                      </td>
                      <td className="py-3 px-4">
                        {formatDateKorean(user.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            차단됨
                          </span>
                        ) : isReported ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            신고 {user.reports_count}건
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            정상
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">
                          {user.matches_count || 0}회
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUserSelect(user)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            상세정보
                          </button>
                          
                          {isBlocked ? (
                            <button
                              onClick={() => handleUnblockUser(user.user_id)}
                              className="text-green-500 hover:text-green-700"
                              disabled={loading}
                            >
                              차단해제
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(user.user_id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={loading}
                            >
                              차단
                            </button>
                          )}
                          
                          {isReported && (
                            <button
                              onClick={() => handleClearReports(user.user_id)}
                              className="text-yellow-500 hover:text-yellow-700"
                              disabled={loading}
                            >
                              신고해제
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 사용자 상세 정보 모달 */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
            
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-2xl">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
              
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
              
              {selectedUser.last_active && (
                <div>
                  <p className="text-sm text-gray-500">최근 활동</p>
                  <p className="font-medium">{formatDateKorean(selectedUser.last_active)}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">매칭 횟수</p>
                <p className="font-medium">{selectedUser.matches_count || 0}회</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">상태</p>
                <p className="font-medium">
                  {selectedUser.is_blocked ? '차단됨' : 
                   selectedUser.reports_count && selectedUser.reports_count > 0 ? `신고 ${selectedUser.reports_count}건` : 
                   '정상'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              {selectedUser.is_blocked ? (
                <button
                  onClick={() => {
                    handleUnblockUser(selectedUser.user_id);
                    handleCloseDetails();
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  차단 해제
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleBlockUser(selectedUser.user_id);
                    handleCloseDetails();
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  차단
                </button>
              )}
              
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
    </div>
  );
} 