'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientSupabaseClient } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_EMAIL = 'notify@smartnewb.com';

type User = {
  id: string;
  user_id: string;
  name: string;
  age?: number;
  gender?: string;
  role?: string;
  classification?: string | null;
  created_at: string;
  updated_at: string;
  
  // 추가 필드 (데이터베이스에 없지만 정보 표시용)
  email?: string; // 프로필이 아닌 auth.users에 있을 수 있는 필드
  is_blocked?: boolean;
  reports_count?: number;
  matches_count?: number;
  last_active?: string;
  instagram_id?: string;
  
  // 프로필 관련 필드 (임시로 코드 호환성을 위해 유지)
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
  const [selectedClass, setSelectedClass] = useState<'all' | 'S' | 'A' | 'B' | 'C' | 'unclassified'>('all');
  const [dbError, setDbError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 페이지당 표시 개수 감소
  const [totalCount, setTotalCount] = useState(0);

  const { isAdmin } = useAuth();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    if (isAdmin) {
      setPage(1); // 필터 변경 시 페이지 초기화
      fetchUsers();
    }
  }, [filter, isAdmin, selectedGender, selectedClass, searchTerm]);
  
  // 페이지 변경 시 데이터 가져오기
  useEffect(() => {
    if (isAdmin && page > 0) {
      fetchUsers();
    }
  }, [page]);
  
  // 검색어 입력 시 디바운스 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAdmin) {
        setPage(1);
        fetchUsers();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null); // 오류 상태 초기화
      
      // 실제 테이블에 존재하는 필드만 선택
      let query = supabase
        .from('profiles')
        .select(
          'id, user_id, name, age, gender, role, classification, created_at, updated_at, instagram_id',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      // 서버 측 필터링 적용
      if (filter === 'blocked') {
        // is_blocked 필드가 없으므로, 임시로 admin 사용자는 필터링하지 않음
        // query = query.eq('role', 'admin');
      } else if (filter === 'reported') {
        // reports_count 필드가 없으므로, 임시로 아무 필터링도 하지 않음
        // query = query.gt('reports_count', 0);
      }
      
      if (selectedGender !== 'all') {
        query = query.eq('gender', selectedGender);
      }
      
      if (selectedClass !== 'all') {
        if (selectedClass === 'unclassified') {
          // classification이 null인 경우 검색
          query = query.is('classification', null);
        } else {
          query = query.eq('classification', selectedClass);
        }
      }
      
      if (searchTerm.trim() !== '') {
        // email 필드가 없으므로 name 필드로만 검색
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data: profilesData, error: profilesError, count } = await query;
        
      if (profilesError) {
        setDbError(profilesError.message);
        return;
      }
      
      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        return;
      }

      // 사용자 목록 설정 (이제 페이지네이션을 사용하므로 항상 더기가 아닌 대체)
      setUsers(profilesData);
      
      // 총 개수 설정
      if (count !== null) {
        setTotalCount(count);
      }
      
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
      
      // is_blocked 필드가 없으므로 임시로 role을 'blocked'로 변경
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'blocked' })
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      // 목록 업데이트
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, role: 'blocked' } : user
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
      
      // is_blocked 필드가 없으므로 role을 'user'로 변경
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      // 목록 업데이트
      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, role: 'user' } : user
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
    alert('신고 기능은 현재 준비중입니다.');
    // reports_count 필드가 없으므로 기능 비활성화
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
      
      console.log('등급 변경 시작 - 사용자 ID:', userId);
      console.log('새 등급:', classification);
      
      // 빈 문자열이면 null로 변환 (미분류 처리)
      const classificationValue = classification === '' ? null : classification;
      
      // 먼저 현재 프로필 정보 확인
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (fetchError) {
        console.error('현재 프로필 조회 오류:', fetchError);
        throw fetchError;
      }
      
      console.log('현재 프로필 정보:', currentProfile);
      
      // 프로필 테이블 업데이트
      const { data, error } = await supabase
        .from('profiles')
        .update({ classification: classificationValue })
        .eq('user_id', userId)
        .select();
        
      if (error) {
        console.error('등급 변경 중 오류:', error);
        throw error;
      }
      
      console.log('등급 변경 성공:', data);
      
      // 사용자 목록 업데이트
      setUsers(prevUsers => prevUsers.map(user => 
        user.user_id === userId ? { ...user, classification: classificationValue } : user
      ));
      
      // 선택된 사용자가 있고, 그 ID가 현재 업데이트하는 ID와 같다면 선택된 사용자 정보도 업데이트
      if (selectedUser && selectedUser.user_id === userId) {
        setSelectedUser(prev => prev ? { ...prev, classification: classificationValue } : null);
      }
      
    } catch (err: any) {
      console.error('등급 변경 중 오류 발생:', err);
      alert(`등급 변경 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* 필터 변경 핸들러 - 이제 서버 측에서 처리됨 */
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1); // 필터 변경 시 페이지 초기화
  };
  
  const handleGenderChange = (gender: 'all' | 'male' | 'female') => {
    setSelectedGender(gender);
    setPage(1); // 필터 변경 시 페이지 초기화
  };
  
  const handleClassChange = (classType: 'all' | 'S' | 'A' | 'B' | 'C' | 'unclassified') => {
    setSelectedClass(classType);
    setPage(1); // 필터 변경 시 페이지 초기화
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // 검색어 변경 시 페이지 초기화는 디바운스된 useEffect에서 처리
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (!loading && newPage > 0 && newPage <= Math.ceil(totalCount / pageSize)) {
      setPage(newPage);
    }
  };
  
  // 페이지 버튼 렌더링
  const renderPagination = () => {
    if (totalCount === 0) return null;
    
    const totalPages = Math.ceil(totalCount / pageSize);
    const maxButtons = 5; // 한 번에 보이는 버튼 수
    
    // 현재 페이지 주변에 보여질 버튼 범위 계산
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    const pageButtons = [];
    
    // 맨 앞으로 버튼 (첫 페이지)
    if (page > 1) {
      pageButtons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 mx-1 rounded border border-gray-300 hover:bg-gray-100"
          disabled={loading}
          title="첫 페이지"
        >
          &laquo;&laquo;
        </button>
      );
    }
    
    // 이전 버튼
    if (page > 1) {
      pageButtons.push(
        <button
          key="prev"
          onClick={() => handlePageChange(page - 1)}
          className="px-3 py-1 mx-1 rounded border border-gray-300 hover:bg-gray-100"
          disabled={loading}
        >
          &laquo;
        </button>
      );
    }
    
    // 페이지 번호 버튼
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded font-bold ${page === i ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-md' : 'border border-gray-300 hover:bg-gray-100 text-gray-700'}`}
          disabled={loading || page === i}
        >
          {i}
        </button>
      );
    }
    
    // 다음 버튼
    if (page < totalPages) {
      pageButtons.push(
        <button
          key="next"
          onClick={() => handlePageChange(page + 1)}
          className="px-3 py-1 mx-1 rounded border border-gray-300 hover:bg-gray-100"
          disabled={loading}
        >
          &raquo;
        </button>
      );
    }
    
    // 맨 뒤로 버튼 (마지막 페이지)
    if (page < totalPages) {
      pageButtons.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 mx-1 rounded border border-gray-300 hover:bg-gray-100"
          disabled={loading}
          title="마지막 페이지"
        >
          &raquo;&raquo;
        </button>
      );
    }
    
    return (
      <div className="flex justify-center items-center py-4">
        {pageButtons}
      </div>
    );
  };

  // 사용자 목록 렌더링 부분
  const renderUsersList = () => {
    if (dbError) {
      return (
        <div className="py-8 text-center">
          <p className="text-red-500">데이터베이스 오류: {dbError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary-DEFAULT text-white rounded hover:bg-primary-dark"
          >
            다시 시도
          </button>
        </div>
      );
    }
    
    if (users.length === 0 && !loading) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500">조건에 맞는 사용자가 없습니다</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
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
              {users.map(user => {
                // 실제 필드가 없으므로 false로 처리
                const isBlocked = false; // user.is_blocked;
                const hasReports = false; // user.reports_count && user.reports_count > 0;
                
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
                      {user.role === 'blocked' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          차단됨
                        </span>
                      ) : user.role === 'admin' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          관리자
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          사용자
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
        
        {/* 페이지네이션 */}
        {renderPagination()}
        
        {/* 페이지 정보 표시 */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 text-sm text-gray-500">
          총 {totalCount}명의 사용자 중 {users.length}명 표시 중
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
              onChange={(e) => handleClassChange(e.target.value as 'all' | 'S' | 'A' | 'B' | 'C' | 'unclassified')}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
            >
              <option value="all">전체 등급</option>
              <option value="unclassified">미분류</option>
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
                onChange={handleSearchChange}
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
        <p className="text-gray-700">총 {totalCount}명의 사용자가 등록되어 있습니다.</p>
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