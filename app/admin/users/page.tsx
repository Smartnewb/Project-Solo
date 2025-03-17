'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const ADMIN_EMAIL = 'notify@smartnewb.com';

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
  // 프로필 추가 정보
  height?: number;
  job?: string;
  education?: string;
  location?: string;
  hobby?: string;
  personality?: string;
  smoking?: boolean;
  drinking?: string;
  religion?: string;
  introduction?: string;
  // 이상형 정보
  ideal_age_min?: number;
  ideal_age_max?: number;
  ideal_height_min?: number;
  ideal_height_max?: number;
  ideal_location?: string;
  ideal_education?: string;
  ideal_smoking?: boolean;
  ideal_drinking?: string;
  ideal_religion?: string;
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'blocked', 'reported', 'active'
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');
  const [selectedClass, setSelectedClass] = useState<'all' | 'S' | 'A' | 'B' | 'C'>('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null); // 오류 상태 초기화
      
      // 기본 프로필 정보 조회 (캐싱 비활성화)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .throwOnError();
        
      if (profilesError) {
        throw profilesError;
      }
      
      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // 이메일 정보 가져오기 (관리자만)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser?.email === ADMIN_EMAIL) {
        try {
          const userIds = profilesData.map(profile => profile.user_id);
          
          // auth.users 테이블에서 실제 존재하는 사용자만 필터링
          const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('id, email')
            .in('id', userIds)
            .throwOnError();

          if (authError) {
            console.error('이메일 정보 조회 오류:', authError);
            setUsers(profilesData);
            return;
          }

          // 실제 존재하는 사용자 ID 목록
          const validUserIds = authUsers?.map(user => user.id) || [];
          
          // 유효한 사용자 ID를 갖는 프로필만 필터링
          const validProfiles = profilesData.filter(profile => 
            validUserIds.includes(profile.user_id)
          );
          
          const usersWithEmail = validProfiles.map(profile => {
            const authUser = authUsers?.find(u => u.id === profile.user_id);
            return {
              ...profile,
              email: authUser?.email || '이메일 정보 없음'
            };
          });
          
          setUsers(usersWithEmail);
          
          // 개발 정보: 유효하지 않은 프로필 수 로깅
          const invalidProfilesCount = profilesData.length - validProfiles.length;
          if (invalidProfilesCount > 0) {
            console.warn(`${invalidProfilesCount}개의 유효하지 않은 프로필이 필터링되었습니다.`);
          }
        } catch (error) {
          console.error('이메일 정보를 가져오는 중 오류가 발생했습니다:', error);
          // 데이터 정합성을 위해 auth.users에 존재하는 사용자 ID만 표시
          const { data: validUsers } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
            
          setUsers(validUsers || []);
        }
      } else {
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

  const handleClassificationChange = async (userId: string, classification: string, gender: string) => {
    try {
      setLoading(true);
      
      // 1. profiles 테이블 업데이트
      const { error: mainProfileError } = await supabase
        .from('profiles')
        .update({ classification })
        .eq('user_id', userId);
      
      if (mainProfileError) {
        throw mainProfileError;
      }

      // 2. 성별에 따른 프로필 테이블 업데이트
      const genderTable = gender === 'male' ? 'male_profiles' : 'female_profiles';
      const { error: genderProfileError } = await supabase
        .from(genderTable)
        .update({ classification })
        .eq('user_id', userId);
      
      if (genderProfileError) {
        console.error(`${genderTable} 업데이트 오류:`, genderProfileError);
        // 성별 테이블 업데이트 실패 시에도 계속 진행
      }

      // 성공적으로 업데이트된 경우 목록 새로고침
      await fetchUsers();
      
      // 성공 메시지 표시
      const message = document.createElement('div');
      message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
      message.textContent = '등급이 성공적으로 업데이트되었습니다.';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);

    } catch (error: any) {
      console.error('분류 업데이트 에러:', error);
      
      // 에러 메시지 표시
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg z-50';
      errorMessage.textContent = '등급 업데이트 중 오류가 발생했습니다.';
      document.body.appendChild(errorMessage);
      setTimeout(() => errorMessage.remove(), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProfiles = () => {
    let profiles: User[] = [];
    
    if (selectedGender === 'all' || selectedGender === 'male') {
      profiles = [...profiles, ...users.filter(user => user.gender === 'male')];
    }
    if (selectedGender === 'all' || selectedGender === 'female') {
      profiles = [...profiles, ...users.filter(user => user.gender === 'female')];
    }

    if (selectedClass !== 'all') {
      profiles = profiles.filter(profile => profile.classification === selectedClass);
    }

    return profiles;
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
          <div className="flex flex-wrap items-center gap-4">
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
            
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value as 'all' | 'male' | 'female')}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
            >
              <option value="all">전체 성별</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as 'all' | 'S' | 'A' | 'B' | 'C')}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
            >
              <option value="all">전체 등급</option>
              <option value="S">S등급</option>
              <option value="A">A등급</option>
              <option value="B">B등급</option>
              <option value="C">C등급</option>
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

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedGender !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 gap-2">
              {selectedGender === 'male' ? '남성' : '여성'}
              <button
                onClick={() => setSelectedGender('all')}
                className="hover:bg-blue-200 rounded-full p-1"
                aria-label="성별 필터 제거"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}
          {selectedClass !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 gap-2">
              {selectedClass}등급
              <button
                onClick={() => setSelectedClass('all')}
                className="hover:bg-purple-200 rounded-full p-1"
                aria-label="등급 필터 제거"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}
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
                {getFilteredProfiles().map((user) => {
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
                        <div className="dropdown relative">
                          <select
                            value={user.classification || ''}
                            onChange={(e) => handleClassificationChange(user.user_id, e.target.value, user.gender || '')}
                            className="input-field w-full py-1 px-2 appearance-none border rounded"
                            disabled={loading}
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                          >
                            <option value="">선택</option>
                            <option value="S">S</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M7 10l5 5 5-5H7z" />
                            </svg>
                          </div>
                        </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8 relative">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white z-10 pb-4 border-b mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">사용자 상세 정보</h2>
                <button 
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 컨텐츠 */}
            <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽 컬럼 */}
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-4xl">
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">이름</p>
                        <p className="font-medium text-lg">{selectedUser.name || '이름 없음'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">이메일 (가입 ID)</p>
                        <p className="font-medium">{selectedUser.email || '이메일 정보 없음'}</p>
                      </div>
                      
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
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">계정 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">사용자 ID</p>
                        <p className="font-medium break-all">{selectedUser.user_id}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">인스타그램</p>
                        <p className="font-medium">
                          {selectedUser.instagramId ? (
                            <a
                              href={`https://www.instagram.com/${selectedUser.instagramId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              @{selectedUser.instagramId}
                            </a>
                          ) : '-'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">등급</p>
                        <p className="font-medium">{selectedUser.classification || '미분류'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">활동 정보</h3>
                    <div className="space-y-3">
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
                        <p className="text-sm text-gray-500">계정 상태</p>
                        <p className="font-medium">
                          {selectedUser.is_blocked ? (
                            <span className="text-red-500">차단됨</span>
                          ) : selectedUser.reports_count && selectedUser.reports_count > 0 ? (
                            <span className="text-yellow-500">신고 {selectedUser.reports_count}건</span>
                          ) : (
                            <span className="text-green-500">정상</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 오른쪽 컬럼 */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">프로필 상세 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">키</p>
                        <p className="font-medium">{selectedUser.height ? `${selectedUser.height}cm` : '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">직업</p>
                        <p className="font-medium">{selectedUser.job || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">학력</p>
                        <p className="font-medium">{selectedUser.education || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">거주지</p>
                        <p className="font-medium">{selectedUser.location || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">취미</p>
                        <p className="font-medium">{selectedUser.hobby || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">성격</p>
                        <p className="font-medium">{selectedUser.personality || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">흡연</p>
                        <p className="font-medium">{selectedUser.smoking ? '흡연' : '비흡연'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">음주</p>
                        <p className="font-medium">{selectedUser.drinking || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">종교</p>
                        <p className="font-medium">{selectedUser.religion || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">자기소개</p>
                        <p className="font-medium whitespace-pre-wrap">{selectedUser.introduction || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">이상형 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">나이</p>
                        <p className="font-medium">
                          {selectedUser.ideal_age_min && selectedUser.ideal_age_max
                            ? `${selectedUser.ideal_age_min}세 ~ ${selectedUser.ideal_age_max}세`
                            : '-'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">키</p>
                        <p className="font-medium">
                          {selectedUser.ideal_height_min && selectedUser.ideal_height_max
                            ? `${selectedUser.ideal_height_min}cm ~ ${selectedUser.ideal_height_max}cm`
                            : '-'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">선호 지역</p>
                        <p className="font-medium">{selectedUser.ideal_location || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">선호 학력</p>
                        <p className="font-medium">{selectedUser.ideal_education || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">흡연 여부</p>
                        <p className="font-medium">
                          {selectedUser.ideal_smoking === true ? '흡연자 가능' :
                           selectedUser.ideal_smoking === false ? '비흡연자만' : '-'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">음주 여부</p>
                        <p className="font-medium">{selectedUser.ideal_drinking || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">종교</p>
                        <p className="font-medium">{selectedUser.ideal_religion || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t">
              <div className="flex justify-end space-x-3">
                {selectedUser.is_blocked ? (
                  <button
                    onClick={() => {
                      handleUnblockUser(selectedUser.user_id);
                      handleCloseDetails();
                    }}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    차단 해제
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleBlockUser(selectedUser.user_id);
                      handleCloseDetails();
                    }}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    차단
                  </button>
                )}
                
                {selectedUser.reports_count && selectedUser.reports_count > 0 && (
                  <button
                    onClick={() => {
                      handleClearReports(selectedUser.user_id);
                      handleCloseDetails();
                    }}
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    신고 내역 삭제
                  </button>
                )}
                
                <button
                  onClick={handleCloseDetails}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 