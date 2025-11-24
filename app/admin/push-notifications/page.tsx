'use client';

import { useState, useEffect } from 'react';
import AdminService from '@/app/services/admin';

interface FilterState {
  isDormant: boolean;
  gender: string;
  universities: string[];
  regions: string[];
  ranks: string[];
  phoneNumber: string;
  hasPreferences?: boolean;
}

interface FilteredUser {
  id: string;
  name: string;
  gender: string;
  profileImageUrl: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phoneNumber: string;
  university: string;
  department: string;
  grade: string;
  rank: string;
  mbti: string | null;
  introduction: string | null;
  profileImages: string[];
  createdAt: string;
}

interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  userIds: string[];
  scheduledAt: string;
  adminId: string;
}

export default function PushNotificationsPage() {
  const [filters, setFilters] = useState<FilterState>({
    isDormant: false,
    gender: '',
    universities: [],
    regions: [],
    ranks: [],
    phoneNumber: '',
    hasPreferences: undefined,
  });

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const [filteredUsers, setFilteredUsers] = useState<FilteredUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [targetUsers, setTargetUsers] = useState<FilteredUser[]>([]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendType, setSendType] = useState<'immediate' | 'scheduled'>('immediate');

  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [universitySearch, setUniversitySearch] = useState('');
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [allUniversities, setAllUniversities] = useState<string[]>([]);

  const filteredUniversities = universitySearch
    ? allUniversities.filter(uni => uni.includes(universitySearch))
    : allUniversities;

  const regionOptions = [
    { code: 'DJN', name: '대전' },
    { code: 'SJG', name: '세종' },
    { code: 'CJU', name: '청주' },
    { code: 'GJJ', name: '공주' },
    { code: 'BSN', name: '부산' },
    { code: 'GHE', name: '김해' },
    { code: 'DGU', name: '대구' },
    { code: 'ICN', name: '인천' },
    { code: 'SEL', name: '서울' },
    { code: 'KYG', name: '경기' },
    { code: 'CAN', name: '천안' },
    { code: 'GWJ', name: '광주' },
  ];

  const ranks = ['S', 'A', 'B', 'C', 'UNKNOWN'];

  useEffect(() => {
    // 토큰 확인
    const token = localStorage.getItem('accessToken');
    const isAdmin = localStorage.getItem('isAdmin');

    console.log('🔐 페이지 로드 시 토큰 상태:', {
      hasToken: !!token,
      isAdmin,
      tokenLength: token?.length
    });

    if (!token || isAdmin !== 'true') {
      alert('로그인이 필요합니다.');
      window.location.href = '/';
      return;
    }

    loadScheduledNotifications();
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      const universities = await AdminService.universities.getUniversities();
      console.log('대학교 목록 조회 성공:', universities);
      setAllUniversities(universities);
    } catch (error) {
      console.error('대학교 목록 조회 실패:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.university-search-container')) {
        setShowUniversityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadScheduledNotifications = async () => {
    try {
      const data = await AdminService.pushNotifications.getScheduledNotifications();
      setScheduledNotifications(data);
    } catch (error) {
      console.error('예약된 알림 조회 실패:', error);
    }
  };

  const handleFilterUsers = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const cleanFilters: any = {};

      if (filters.isDormant) cleanFilters.isDormant = true;
      if (filters.gender) cleanFilters.gender = filters.gender;
      if (filters.universities.length > 0) cleanFilters.universities = filters.universities;
      if (filters.regions.length > 0) cleanFilters.regions = filters.regions;
      if (filters.ranks.length > 0) cleanFilters.ranks = filters.ranks;
      if (filters.phoneNumber) cleanFilters.phoneNumber = filters.phoneNumber;
      if (filters.hasPreferences !== undefined) cleanFilters.hasPreferences = filters.hasPreferences;

      const data = await AdminService.pushNotifications.filterUsers(cleanFilters, page, itemsPerPage);
      setFilteredUsers(data.users);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('사용자 필터링 실패:', error);
      alert('사용자 필터링에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    handleFilterUsers(newPage);
  };

  const handleViewProfile = async (userId: string) => {
    setLoadingProfile(true);
    setShowProfileModal(true);
    try {
      const profile = await AdminService.users.getUserDetails(userId);
      setSelectedUser(profile);
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      alert('프로필 정보를 불러오는데 실패했습니다.');
      setShowProfileModal(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  const handleSendPushNotification = async () => {
    if (!title || !message) {
      alert('제목과 메시지를 입력해주세요.');
      return;
    }

    if (targetUsers.length === 0) {
      alert('발송 대상 사용자가 없습니다. 먼저 사용자를 검색하고 발송 대상자 리스트에 추가해주세요.');
      return;
    }

    if (sendType === 'scheduled' && !scheduledAt) {
      alert('예약 발송 시간을 선택해주세요.');
      return;
    }

    // 토큰 확인
    const token = localStorage.getItem('accessToken');
    const isAdmin = localStorage.getItem('isAdmin');
    console.log('🔐 토큰 상태:', { hasToken: !!token, isAdmin, tokenPreview: token?.substring(0, 20) + '...' });

    if (!token) {
      alert('로그인 토큰이 없습니다. 다시 로그인해주세요.');
      window.location.href = '/';
      return;
    }

    const confirmMessage = sendType === 'immediate'
      ? `총 ${targetUsers.length}명에게 즉시 푸시 알림을 발송하시겠습니까?`
      : `총 ${targetUsers.length}명에게 ${scheduledAt}에 푸시 알림을 예약하시겠습니까?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        title,
        message,
        userIds: targetUsers.map(u => u.id), // 발송 대상자 리스트의 userId 배열 전달
      };

      if (sendType === 'scheduled') {
        data.scheduledAt = scheduledAt;
      }

      console.log('📤 푸시 알림 발송 요청:', data);
      const result = await AdminService.pushNotifications.sendPushNotification(data);
      console.log('✅ 푸시 알림 발송 성공:', result);

      if (sendType === 'immediate') {
        alert(`푸시 알림 발송 완료\n성공: ${result.successCount}건\n실패: ${result.failureCount}건`);
      } else {
        alert('푸시 알림이 예약되었습니다.');
        loadScheduledNotifications();
      }

      setTitle('');
      setMessage('');
      setScheduledAt('');
      setTargetUsers([]); // 발송 후 리스트 초기화
    } catch (error: any) {
      console.error('❌ 푸시 알림 발송 실패:', error);
      console.error('에러 상세:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      if (error?.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/';
      } else {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || '푸시 알림 발송에 실패했습니다.';
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScheduled = async (scheduleId: string) => {
    if (!confirm('예약된 푸시 알림을 취소하시겠습니까?')) {
      return;
    }

    try {
      await AdminService.pushNotifications.cancelScheduledNotification(scheduleId);
      alert('예약이 취소되었습니다.');
      loadScheduledNotifications();
    } catch (error) {
      console.error('예약 취소 실패:', error);
      alert('예약 취소에 실패했습니다.');
    }
  };

  const toggleUniversity = (university: string) => {
    setFilters(prev => ({
      ...prev,
      universities: prev.universities.includes(university)
        ? prev.universities.filter(u => u !== university)
        : [...prev.universities, university],
    }));
    setCurrentPage(1);
  };

  const toggleRegion = (region: string) => {
    setFilters(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }));
    setCurrentPage(1);
  };

  const toggleRank = (rank: string) => {
    setFilters(prev => ({
      ...prev,
      ranks: prev.ranks.includes(rank)
        ? prev.ranks.filter(r => r !== rank)
        : [...prev.ranks, rank],
    }));
    setCurrentPage(1);
  };

  const addToTargetUsers = async () => {
    if (totalCount === 0) {
      alert('추가할 사용자가 없습니다.');
      return;
    }

    if (!confirm(`총 ${totalCount}명의 사용자를 발송 대상자 리스트에 추가하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      const cleanFilters: any = {};

      if (filters.isDormant) cleanFilters.isDormant = true;
      if (filters.gender) cleanFilters.gender = filters.gender;
      if (filters.universities.length > 0) cleanFilters.universities = filters.universities;
      if (filters.regions.length > 0) cleanFilters.regions = filters.regions;
      if (filters.ranks.length > 0) cleanFilters.ranks = filters.ranks;
      if (filters.phoneNumber) cleanFilters.phoneNumber = filters.phoneNumber;
      if (filters.hasPreferences !== undefined) cleanFilters.hasPreferences = filters.hasPreferences;

      // 모든 페이지의 사용자를 가져오기
      const allUsers: FilteredUser[] = [];
      const totalPagesToFetch = Math.ceil(totalCount / itemsPerPage);

      for (let page = 1; page <= totalPagesToFetch; page++) {
        const data = await AdminService.pushNotifications.filterUsers(cleanFilters, page, itemsPerPage);
        allUsers.push(...data.users);
      }

      // 중복 제거하며 추가
      const newTargetUsers = [...targetUsers];
      let addedCount = 0;

      allUsers.forEach(user => {
        if (!newTargetUsers.find(u => u.id === user.id)) {
          newTargetUsers.push(user);
          addedCount++;
        }
      });

      setTargetUsers(newTargetUsers);
      alert(`${addedCount}명이 발송 대상자 리스트에 추가되었습니다.\n(중복 ${allUsers.length - addedCount}명 제외)`);
    } catch (error) {
      console.error('사용자 추가 실패:', error);
      alert('사용자 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeFromTargetUsers = (userId: string) => {
    setTargetUsers(prev => prev.filter(u => u.id !== userId));
  };

  const clearTargetUsers = () => {
    if (!confirm('발송 대상자 리스트를 전체 초기화하시겠습니까?')) {
      return;
    }
    setTargetUsers([]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">푸시 알림 관리</h1>

      {/* 필터링 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">사용자 필터링</h2>
        
        <div className="space-y-4">
          {/* 휴면 유저 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDormant"
              checked={filters.isDormant}
              onChange={(e) => setFilters({ ...filters, isDormant: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isDormant">휴면 유저 (남성, 최근 7일 미접속)</label>
          </div>

          {/* 성별 */}
          <div>
            <label className="block mb-2 font-medium">성별</label>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">전체</option>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </div>

          {/* 대학교 */}
          <div>
            <label className="block mb-2 font-medium">대학교</label>

            {/* 선택된 대학교 표시 */}
            {filters.universities.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {filters.universities.map(university => (
                  <span
                    key={university}
                    className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {university}
                    <button
                      onClick={() => toggleUniversity(university)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 검색 입력 */}
            <div className="relative university-search-container">
              <input
                type="text"
                placeholder="대학교 검색..."
                value={universitySearch}
                onChange={(e) => {
                  setUniversitySearch(e.target.value);
                  setShowUniversityDropdown(true);
                }}
                onFocus={() => setShowUniversityDropdown(true)}
                className="border rounded px-3 py-2 w-full"
              />

              {/* 드롭다운 */}
              {showUniversityDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                  {filteredUniversities.length > 0 ? (
                    filteredUniversities.map(university => (
                      <div
                        key={university}
                        onClick={() => {
                          toggleUniversity(university);
                          setUniversitySearch('');
                          setShowUniversityDropdown(false);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          filters.universities.includes(university) ? 'bg-blue-50' : ''
                        }`}
                      >
                        {university}
                        {filters.universities.includes(university) && (
                          <span className="ml-2 text-blue-600">✓</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">검색 결과가 없습니다</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 지역 */}
          <div>
            <label className="block mb-2 font-medium">지역</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {regionOptions.map(region => (
                <label key={region.code} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.regions.includes(region.code)}
                    onChange={() => toggleRegion(region.code)}
                    className="mr-2"
                  />
                  {region.name}
                </label>
              ))}
            </div>
          </div>

          {/* 외모 등급 */}
          <div>
            <label className="block mb-2 font-medium">외모 등급</label>
            <div className="flex gap-4">
              {ranks.map(rank => (
                <label key={rank} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.ranks.includes(rank)}
                    onChange={() => toggleRank(rank)}
                    className="mr-2"
                  />
                  {rank}
                </label>
              ))}
            </div>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block mb-2 font-medium">전화번호</label>
            <input
              type="text"
              value={filters.phoneNumber}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setFilters({ ...filters, phoneNumber: formatted });
              }}
              placeholder="010-1234-5678"
              className="border rounded px-3 py-2 w-full"
              maxLength={13}
            />
          </div>

          {/* 프로필 정보 입력 유무 */}
          <div>
            <label className="block mb-2 font-medium">프로필 정보 입력 유무</label>
            <select
              value={filters.hasPreferences === undefined ? '' : filters.hasPreferences.toString()}
              onChange={(e) => setFilters({ 
                ...filters, 
                hasPreferences: e.target.value === '' ? undefined : e.target.value === 'true' 
              })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">전체</option>
              <option value="true">입력 완료</option>
              <option value="false">미입력</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleFilterUsers(1)}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '조회 중...' : '사용자 검색'}
            </button>

            {totalCount > 0 && (
              <button
                onClick={addToTargetUsers}
                disabled={loading}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? '추가 중...' : `발송 대상자 리스트에 추가 (${totalCount}명)`}
              </button>
            )}
          </div>

          {totalCount > 0 && (
            <div className="mt-4">
              <div className="p-4 bg-blue-50 rounded mb-4">
                <p className="font-semibold">검색 결과: 총 {totalCount}명</p>
                <p className="text-sm text-gray-600">현재 페이지: {filteredUsers.length}명</p>
              </div>

              {/* 사용자 목록 */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">프로필</th>
                      <th className="px-4 py-2 text-left">이름</th>
                      <th className="px-4 py-2 text-left">성별</th>
                      <th className="px-4 py-2 text-left">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt={user.name}
                              onClick={() => handleViewProfile(user.id)}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500"
                            />
                          ) : (
                            <div
                              onClick={() => handleViewProfile(user.id)}
                              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500"
                            >
                              <span className="text-gray-500 text-xs">없음</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">{user.name}</td>
                        <td className="px-4 py-2">{user.gender === 'MALE' ? '남성' : '여성'}</td>
                        <td className="px-4 py-2 text-xs text-gray-500">{user.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    처음
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 border rounded ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    마지막
                  </button>

                  <span className="ml-4 text-sm text-gray-600">
                    {currentPage} / {totalPages} 페이지
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 발송 대상자 리스트 섹션 */}
      {targetUsers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">발송 대상자 리스트 ({targetUsers.length}명)</h2>
            <button
              onClick={clearTargetUsers}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              전체 초기화
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">프로필</th>
                  <th className="px-4 py-2 text-left">이름</th>
                  <th className="px-4 py-2 text-left">성별</th>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">작업</th>
                </tr>
              </thead>
              <tbody>
                {targetUsers.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.name}
                          onClick={() => handleViewProfile(user.id)}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500"
                        />
                      ) : (
                        <div
                          onClick={() => handleViewProfile(user.id)}
                          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500"
                        >
                          <span className="text-gray-500 text-xs">없음</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.gender === 'MALE' ? '남성' : '여성'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{user.id}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeFromTargetUsers(user.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        제거
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 푸시 알림 발송 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">푸시 알림 발송</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">발송 유형</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="immediate"
                  checked={sendType === 'immediate'}
                  onChange={(e) => setSendType(e.target.value as 'immediate')}
                  className="mr-2"
                />
                즉시 발송
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="scheduled"
                  checked={sendType === 'scheduled'}
                  onChange={(e) => setSendType(e.target.value as 'scheduled')}
                  className="mr-2"
                />
                예약 발송
              </label>
            </div>
          </div>

          {sendType === 'scheduled' && (
            <div>
              <label className="block mb-2 font-medium">예약 시간</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          )}

          <div>
            <label className="block mb-2 font-medium">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="푸시 알림 제목"
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">메시지</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="푸시 알림 메시지"
              rows={4}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <button
            onClick={handleSendPushNotification}
            disabled={loading || targetUsers.length === 0}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? '발송 중...' : sendType === 'immediate' ? `즉시 발송 (총 ${targetUsers.length}명)` : `예약 발송 (총 ${targetUsers.length}명)`}
          </button>
        </div>
      </div>

      {/* 예약된 푸시 알림 목록 */}
      {scheduledNotifications.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">예약된 푸시 알림</h2>
          
          <div className="space-y-4">
            {scheduledNotifications.map(notification => (
              <div key={notification.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{notification.title}</h3>
                    <p className="text-gray-600">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      예약 시간: {new Date(notification.scheduledAt).toLocaleString('ko-KR')}
                    </p>
                    <p className="text-sm text-gray-500">
                      대상: {notification.userIds.length}명
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelScheduled(notification.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    취소
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 프로필 상세 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeProfileModal}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {loadingProfile ? (
              <div className="text-center py-8">
                <p>프로필 정보를 불러오는 중...</p>
              </div>
            ) : selectedUser ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">프로필 상세 정보</h2>
                  <button onClick={closeProfileModal} className="text-gray-500 hover:text-gray-700 text-2xl">
                    ×
                  </button>
                </div>

                {/* 프로필 이미지 */}
                {selectedUser.profileImages && selectedUser.profileImages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">프로필 이미지</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedUser.profileImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`프로필 ${idx + 1}`}
                          className="w-full h-40 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 기본 정보 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">이름</p>
                      <p className="font-semibold">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">나이</p>
                      <p className="font-semibold">{selectedUser.age}세</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">성별</p>
                      <p className="font-semibold">{selectedUser.gender === 'MALE' ? '남성' : '여성'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">외모 등급</p>
                      <p className="font-semibold">{selectedUser.rank}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-semibold text-sm">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">전화번호</p>
                      <p className="font-semibold">{selectedUser.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">대학교</p>
                      <p className="font-semibold">{selectedUser.university}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">학과</p>
                      <p className="font-semibold">{selectedUser.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">학년</p>
                      <p className="font-semibold">{selectedUser.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">MBTI</p>
                      <p className="font-semibold">{selectedUser.mbti || '-'}</p>
                    </div>
                  </div>

                  {selectedUser.introduction && (
                    <div>
                      <p className="text-sm text-gray-600">자기소개</p>
                      <p className="font-semibold">{selectedUser.introduction}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">가입일</p>
                    <p className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">사용자 ID</p>
                    <p className="font-semibold text-xs text-gray-500">{selectedUser.id}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeProfileModal}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>프로필 정보를 불러올 수 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

