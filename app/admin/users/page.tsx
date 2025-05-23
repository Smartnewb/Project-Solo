'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axiosServer from '@/utils/axios';
import { formatDateWithoutTimezoneConversion } from '@/app/utils/formatters';

type ProfileImage = {
  id: string;
  order: number;
  isMain: boolean;
  url: string;
};

type UniversityDetails = {
  name: string;
  authentication: boolean;
  department: string;
};

type PreferenceOption = {
  id: string;
  displayName: string;
};

type Preference = {
  typeName: string;
  selectedOptions: PreferenceOption[];
};

interface User {
  id: string;
  userId: string;
  email: string;
  role: string;
  classification: string | null;
  gender: 'MALE' | 'FEMALE';
  createdAt: string;
  name: string;
  age: number;
  instagramId: string | null;
  profileImages: ProfileImage[];
  universityDetails: UniversityDetails | null;
  preferences: Preference[];
}

type ApiResponse = {
  items: User[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const getGenderText = (gender: string) => {
  if (gender === 'MALE') return '남성';
  if (gender === 'FEMALE') return '여성';
  return '미지정';
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'blocked', 'reported', 'active'
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'MALE' | 'FEMALE'>('all');
  const [selectedClass, setSelectedClass] = useState<'all' | 'S' | 'A' | 'B' | 'C' | 'unclassified'>('all');
  const [dbError, setDbError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // 페이지당 표시 개수 고정
  const [totalCount, setTotalCount] = useState(0);

  const { isAdmin } = useAuth();

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

      // API 요청 파라미터 구성 (페이지네이션만)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString()
      });

      // Nest.js API 호출
      const response = await axiosServer.get<ApiResponse>(`/admin/users?${params}`);
      const { items, meta } = response.data;

      setUsers(items);
      setTotalCount(meta.totalItems);

    } catch (err: any) {
      console.error('사용자 목록 불러오기 오류:', err);
      setError(err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const handleUserSelect = async (user: User) => {
    console.log('사용자 상세 정보 모달 열림:', user);
    console.log('사용자 ID:', user.id);
    console.log('사용자 이름:', user.name);
    console.log('사용자 프로필 이미지 배열:', user.profileImages);

    if (user.profileImages) {
      console.log('프로필 이미지 개수:', user.profileImages.length);
      user.profileImages.forEach((img, index) => {
        console.log(`이미지 ${index + 1}:`, img.id, img.url, img.isMain ? '(메인)' : '');
      });

      // 메인 이미지 찾기
      const mainImage = user.profileImages.find(img => img.isMain === true);
      console.log('메인 이미지:', mainImage);
    }

    setSelectedUser(user);

    // 사용자의 메인 이미지를 기본 선택 이미지로 설정, 없으면 첫 번째 이미지 사용
    if (user.profileImages && user.profileImages.length > 0) {
      // 메인 이미지 찾기
      const mainImage = user.profileImages.find(img => img.isMain === true);

      // 메인 이미지가 있으면 사용, 없으면 첫 번째 이미지 사용
      const imageToUse = mainImage || user.profileImages[0];
      const imageUrl = imageToUse.url;

      console.log('기본 선택 이미지 설정:', imageUrl);
      setSelectedImage(imageUrl);

      // 상태 업데이트 후 확인을 위한 setTimeout
      setTimeout(() => {
        console.log('상태 업데이트 후 selectedImage:', selectedImage);
      }, 100);
    } else {
      setSelectedImage(null);
      console.log('프로필 이미지 없음');
    }
  };

  const handleCloseDetails = () => {
    console.log('사용자 상세 정보 모달 닫힘');
    setSelectedUser(null);
    setSelectedImage(null);
  };

  // 이미지 클릭 함수는 인라인으로 구현하여 직접 사용

  const handleBlockUser = async (userId: string) => {
  };

  const handleUnblockUser = async (userId: string) => {
  };

  const handleClassificationChange = async (userId: string, classification: string, gender: string) => {
    try {
      setLoading(true);

      console.log('등급 변경 시작 - 사용자 ID:', userId);
      console.log('새 등급:', classification);

      if (error) {
        console.error('등급 변경 중 오류:', error);
        throw error;
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

  const handleGenderChange = (gender: 'all' | 'MALE' | 'FEMALE') => {
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
    const totalPages = Math.ceil(totalCount / pageSize);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            이전
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            다음
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{page}</span> 페이지 / 총{' '}
              <span className="font-medium">{totalPages}</span> 페이지
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <span className="sr-only">이전</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {pages.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pageNum
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <span className="sr-only">다음</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
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
                const hasInstagramError = user.statusAt === 'instagramerror';

                return (
                  <tr
                    key={user.userId}
                    className={`hover:bg-gray-50 ${isBlocked ? 'bg-red-50' : hasReports ? 'bg-yellow-50' : hasInstagramError ? 'bg-orange-50' : ''}`}
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
                          onChange={(e) => handleClassificationChange(user.userId, e.target.value, user.gender || '')}
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
                      {getGenderText(user.gender)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.instagramId ? (
                          <>
                            <a
                              href={`https://www.instagram.com/${user.instagramId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              @{user.instagramId}
                            </a>
                            {user.statusAt === 'instagramerror' && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                인스타그램 오류
                              </span>
                            )}
                          </>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.createdAt ? formatDateWithoutTimezoneConversion(user.createdAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
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

                        {user.statusAt === 'instagramerror' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            인스타그램 오류
                          </span>
                        )}
                      </div>
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
                            onClick={() => handleUnblockUser(user.userId)}
                            className="text-green-500 hover:text-green-700"
                            disabled={loading}
                          >
                            차단해제
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockUser(user.userId)}
                            className="text-red-500 hover:text-red-700"
                            disabled={loading}
                          >
                            차단
                          </button>
                        )}

                        {hasReports && (
                          <button
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
              onChange={(e) => setSelectedGender(e.target.value as 'all' | 'MALE' | 'FEMALE')}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
            >
              <option value="all">전체 성별</option>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
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
              {selectedGender === 'MALE' ? '남성' : '여성'}
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
                  <div className="space-y-4">
                    {/* 메인 이미지 */}
                    <div className="flex justify-center">
                      <div
                        className="h-48 w-48 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 text-4xl overflow-hidden"
                        onClick={() => {
                          console.log('현재 메인 이미지 상태:', selectedImage);
                          console.log('사용자 프로필 이미지:', selectedUser.profileImages);

                          // 메인 이미지 찾기
                          const mainImage = selectedUser.profileImages.find(img => img.isMain === true);
                          if (mainImage) {
                            console.log('메인 이미지 정보:', mainImage.id, mainImage.url);
                          }
                        }}
                      >
                        {selectedImage ? (
                          <img
                            src={selectedImage}
                            alt={selectedUser.name}
                            className="h-full w-full object-cover"
                          />
                        ) : selectedUser.profileImages && selectedUser.profileImages.length > 0 ? (
                          <img
                            src={selectedUser.profileImages[0].url}
                            alt={selectedUser.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          selectedUser.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* 이미지 썸네일 목록 */}
                    {selectedUser.profileImages && selectedUser.profileImages.length > 1 && (
                      <div className="flex justify-center gap-2 flex-wrap">
                        {selectedUser.profileImages.map((image, index) => (
                          <div
                            key={image.id}
                            className={`h-16 w-16 rounded-md overflow-hidden cursor-pointer border-2 ${
                              (selectedImage === image.url) ? 'border-blue-500' : 'border-transparent'
                            }`}
                            onClick={() => {
                              console.log('썸네일 이미지 클릭:', image.id, image.url, image.isMain ? '(메인)' : '');
                              // 직접 상태 업데이트
                              setSelectedImage(image.url);
                              console.log('선택된 이미지 변경됨:', image.url);
                            }}
                          >
                            <img
                              src={image.url}
                              alt={`${selectedUser.name} 프로필 이미지 ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">이름</p>
                        <p className="font-medium">{selectedUser.name}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">나이</p>
                        <p className="font-medium">{selectedUser.age}세</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">성별</p>
                        <p className="font-medium">{getGenderText(selectedUser.gender)}</p>
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
                    </div>
                  </div>

                  {selectedUser.universityDetails && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">대학교 정보</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">학교명</p>
                          <p className="font-medium">{selectedUser.universityDetails.name}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">학과</p>
                          <p className="font-medium">{selectedUser.universityDetails.department}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">인증 상태</p>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedUser.universityDetails.authentication
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {selectedUser.universityDetails.authentication ? '인증됨' : '미인증'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 오른쪽 컬럼 - 선호도 정보 */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">선호도 정보</h3>
                    <div className="space-y-4">
                      {selectedUser.preferences?.map((pref, index) => (
                        <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
                          <p className="text-sm text-gray-500 mb-1">{pref.typeName}</p>
                          <div className="flex flex-wrap gap-2">
                            {pref.selectedOptions.map((option, optIndex) => (
                              <span
                                key={optIndex}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                              >
                                {option.displayName}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {(!selectedUser.preferences || selectedUser.preferences.length === 0) && (
                        <p className="text-gray-500 text-sm">등록된 선호도 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t">
              <div className="flex justify-end">
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