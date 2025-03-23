'use client';

import { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  instagram_id?: string;
  classification?: string;
  
  // 프로필 필드
  height?: number;
  university?: string;
  department?: string;
  student_id?: string;
  grade?: string;
  personalities?: string[];
  dating_styles?: string[];
  lifestyles?: string[];
  interests?: string[];
  drinking?: string;
  smoking?: string;
  tattoo?: string;
  mbti?: string;
  
  // 이상형 정보 (user_preferences 테이블)
  preferred_age_type?: string;
  preferred_height_min?: number;
  preferred_height_max?: number;
  preferred_personalities?: string[];
  preferred_dating_styles?: string[];
  preferred_lifestyles?: string[];
  preferred_interests?: string[];
  preferred_drinking?: string;
  preferred_smoking?: string;
  preferred_tattoo?: string;
  preferred_mbti?: string;
  disliked_mbti?: string;
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
  const { isAdmin } = useAuth();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [filter, isAdmin]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null); // 오류 상태 초기화
      
      console.log('사용자 데이터 불러오기 시작');
      
      // 기본 프로필 정보 조회
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error('프로필 데이터 조회 오류:', profilesError);
        throw profilesError;
      }
      
      console.log('프로필 데이터 불러오기 성공:', profilesData?.length || 0, '개의 프로필');
      
      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // 사용자 목록 설정
      setUsers(profilesData);
      console.log('사용자 목록 설정 완료');
      
    } catch (err: any) {
      console.error('사용자 목록 불러오기 오류:', err);
      setError(err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const handleUserSelect = async (user: User) => {
    try {
      console.log('선택된 사용자 기본 정보:', user);

      // 프로필과 이상형 정보를 함께 조회
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_preferences!inner(*)
        `)
        .eq('user_id', user.user_id)
        .single();

      if (profileError) {
        console.error('프로필 정보 조회 오류:', profileError);
        // 프로필 정보만이라도 표시
        setSelectedUser(user);
        return;
      }

      console.log('조회된 프로필 데이터:', profileData);

      // 기본 사용자 정보와 프로필, 이상형 정보를 모두 합쳐서 상태 업데이트
      const userWithPreferences = {
        ...user,
        ...profileData,
        ...(profileData?.user_preferences?.[0] || {})
      };

      console.log('최종 병합된 사용자 데이터:', userWithPreferences);
      setSelectedUser(userWithPreferences);
      
    } catch (error) {
      console.error('사용자 상세 정보 조회 중 오류 발생:', error);
      // 에러 발생시 기본 정보라도 표시
      setSelectedUser(user);
    }
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

  const handleClassificationChange = async (userId: string, classification: string, gender: string) => {
    try {
      setLoading(true);
      
      console.log('등급 변경 시작:', userId, classification);
      
      // 프로필 테이블 업데이트
      const { data, error } = await supabase
        .from('profiles')
        .update({ classification })
        .eq('user_id', userId)
        .select();
        
      if (error) {
        console.error('등급 변경 중 오류:', error);
        throw error;
      }
      
      console.log('등급 변경 성공:', data);
      
      // 사용자 목록 업데이트
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, classification } : user
      ));
      
    } catch (err: any) {
      console.error('등급 변경 중 오류 발생:', err);
      alert('등급 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /* 필터링된 사용자 목록 가져오기 */
  const getFilteredProfiles = () => {
    if (!users || users.length === 0) {
      console.log('사용자 목록 없음');
      return [];
    }
    
    console.log(`전체 사용자 수: ${users.length}명, 필터링 전`);
    
    // 검색 필터링
    let filtered = [...users];
    
    // 성별 필터
    if (selectedGender !== 'all') {
      filtered = filtered.filter(user => user.gender === selectedGender);
    }
    
    // 등급 필터
    if (selectedClass !== 'all') {
      filtered = filtered.filter(user => user.classification === selectedClass);
    }
    
    // 검색어 필터
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.user_id && user.user_id.toLowerCase().includes(searchLower))
      );
    }
    
    // 상태 필터
    if (filter === 'blocked') {
      filtered = filtered.filter(user => user.is_blocked === true);
    } else if (filter === 'reported') {
      filtered = filtered.filter(user => user.reports_count && user.reports_count > 0);
    } else if (filter === 'active') {
      // 최근 30일 이내에 활동한 사용자
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(user => {
        if (!user.last_active) return false;
        const lastActive = new Date(user.last_active);
        return lastActive > thirtyDaysAgo;
      });
    }
    
    console.log(`필터링 후 사용자 수: ${filtered.length}명`);
    
    return filtered;
  };

  // 사용자 목록 렌더링 부분
  const renderUsersList = () => {
    const filteredUsers = getFilteredProfiles();
    
    if (filteredUsers.length === 0) {
      console.log('필터링된 사용자가 없음');
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500">조건에 맞는 사용자가 없습니다</p>
        </div>
      );
    }
    
    console.log('사용자 목록 렌더링:', filteredUsers.length);
    
    return (
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  분류
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  나이/성별
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  인스타그램
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => {
                const isBlocked = user.is_blocked;
                const hasReports = user.reports_count && user.reports_count > 0;
                
                return (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 ${isBlocked ? 'bg-red-50' : hasReports ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-medium">{user.name || '이름 없음'}</div>
                          <div className="text-sm text-gray-500">{user.email || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <select
                          value={user.classification || ''}
                          onChange={(e) => handleClassificationChange(user.user_id, e.target.value, user.gender || '')}
                          className="appearance-none bg-transparent border border-gray-300 rounded-md py-1 px-3 pr-8 focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT text-sm"
                          disabled={loading || isBlocked}
                        >
                          <option value="">미분류</option>
                          <option value="S">S급</option>
                          <option value="A">A급</option>
                          <option value="B">B급</option>
                          <option value="C">C급</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.age ? `${user.age}세` : '-'} / {' '}
                      {user.gender === 'male' ? '남성' : 
                       user.gender === 'female' ? '여성' : '기타'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.instagram_id ? (
                        <a
                          href={`https://www.instagram.com/${user.instagram_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          @{user.instagram_id}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDateKorean(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isBlocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          차단됨
                        </span>
                      ) : hasReports ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          신고 {user.reports_count}건
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          정상
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                        
                        {hasReports && (
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
    );
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
        <p className="text-gray-700">총 {getFilteredProfiles().length}명의 사용자가 등록되어 있습니다.</p>
      </div>
      
      {renderUsersList()}
      
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
                        <p className="font-medium">{selectedUser.name || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">학교</p>
                        <p className="font-medium">{selectedUser.university || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">학과</p>
                        <p className="font-medium">{selectedUser.department || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">학번</p>
                        <p className="font-medium">{selectedUser.student_id || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">학년</p>
                        <p className="font-medium">{selectedUser.grade || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">인스타그램</p>
                        <p className="font-medium">
                          {selectedUser.instagram_id ? (
                            <a
                              href={`https://www.instagram.com/${selectedUser.instagram_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              @{selectedUser.instagram_id}
                            </a>
                          ) : '-'}
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
                        <p className="text-sm text-gray-500">성격</p>
                        <p className="font-medium">{selectedUser.personalities?.join(', ') || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">데이트 스타일</p>
                        <p className="font-medium">{selectedUser.dating_styles?.join(', ') || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">라이프스타일</p>
                        <p className="font-medium">{selectedUser.lifestyles?.join(', ') || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">관심사</p>
                        <p className="font-medium">{selectedUser.interests?.join(', ') || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">MBTI</p>
                        <p className="font-medium">{selectedUser.mbti || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">음주</p>
                        <p className="font-medium">{selectedUser.drinking || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">흡연</p>
                        <p className="font-medium">{selectedUser.smoking || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">타투</p>
                        <p className="font-medium">{selectedUser.tattoo || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">이상형 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">선호 연령대</p>
                        <p className="font-medium">{selectedUser.preferred_age_type || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">선호 키</p>
                        <p className="font-medium">
                          {selectedUser.preferred_height_min && selectedUser.preferred_height_max
                            ? `${selectedUser.preferred_height_min}cm ~ ${selectedUser.preferred_height_max}cm`
                            : '-'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">선호하는 성격</p>
                        <p className="font-medium">{selectedUser.preferred_personalities?.join(', ') || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">선호하는 데이트 스타일</p>
                        <p className="font-medium">{selectedUser.preferred_dating_styles?.join(', ') || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">선호하는 라이프스타일</p>
                        <p className="font-medium">{selectedUser.preferred_lifestyles?.join(', ') || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">선호하는 관심사</p>
                        <p className="font-medium">{selectedUser.preferred_interests?.join(', ') || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">선호하는 MBTI</p>
                        <p className="font-medium">{selectedUser.preferred_mbti || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">비선호 MBTI</p>
                        <p className="font-medium">{selectedUser.disliked_mbti || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">음주 선호</p>
                        <p className="font-medium">{selectedUser.preferred_drinking || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">흡연 선호</p>
                        <p className="font-medium">{selectedUser.preferred_smoking || '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">타투 선호</p>
                        <p className="font-medium">{selectedUser.preferred_tattoo || '-'}</p>
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