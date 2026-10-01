'use client';
import { RadioGroup, Radio, Label, Modal, Checkbox, Select, ListBox, Button, Input, TextArea } from '@heroui/react';
import type { PushLegalClass } from '@/app/services/admin';
import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { safeToLocaleDateString } from '@/app/utils/formatters';
import AdminService from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { pushNotificationFormSchema, type PushNotificationFormData } from '@/app/admin/hooks/forms/schemas/push-notification.schema';
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
export function PushSendTab() {
    const [legalClass, setLegalClass] = useState<PushLegalClass>('advertising');
    const toast = useToast();
    const confirmAction = useConfirm();
    const { control, reset, handleFormSubmit, formState: { isSubmitting } } = useAdminForm<PushNotificationFormData>({
        schema: pushNotificationFormSchema,
        defaultValues: { title: '', message: '' },
    });
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
        }
        else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        }
        else if (numbers.length <= 11) {
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
        loadUniversities();
    }, []);
    const loadUniversities = async () => {
        try {
            const universities = await AdminService.universities.getUniversities();
            setAllUniversities(universities);
        }
        catch {
            // silently fail - universities list is non-critical
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
    const handleFilterUsers = async (page: number = currentPage) => {
        setLoading(true);
        try {
            const cleanFilters: any = {};
            if (filters.isDormant)
                cleanFilters.isDormant = true;
            if (filters.gender)
                cleanFilters.gender = filters.gender;
            if (filters.universities.length > 0)
                cleanFilters.universities = filters.universities;
            if (filters.regions.length > 0)
                cleanFilters.regions = filters.regions;
            if (filters.ranks.length > 0)
                cleanFilters.ranks = filters.ranks;
            if (filters.phoneNumber)
                cleanFilters.phoneNumber = filters.phoneNumber;
            if (filters.hasPreferences !== undefined)
                cleanFilters.hasPreferences = filters.hasPreferences;
            const data = await AdminService.pushNotifications.filterUsers(cleanFilters, page, itemsPerPage);
            setFilteredUsers(data.users);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
            setCurrentPage(page);
        }
        catch {
            toast.error('사용자 필터링에 실패했습니다.');
        }
        finally {
            setLoading(false);
        }
    };
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages)
            return;
        handleFilterUsers(newPage);
    };
    const handleViewProfile = async (userId: string) => {
        setLoadingProfile(true);
        setShowProfileModal(true);
        try {
            const profile = await AdminService.userAppearance.getUserDetails(userId);
            setSelectedUser(profile);
        }
        catch {
            toast.error('프로필 정보를 불러오는데 실패했습니다.');
            setShowProfileModal(false);
        }
        finally {
            setLoadingProfile(false);
        }
    };
    const closeProfileModal = () => {
        setShowProfileModal(false);
        setSelectedUser(null);
    };
    const handleSendPushNotification = handleFormSubmit(async (data) => {
        if (targetUsers.length === 0) {
            toast.error('발송 대상 사용자가 없습니다. 먼저 사용자를 검색하고 발송 대상자 리스트에 추가해주세요.');
            return;
        }
        const ok = await confirmAction({
            title: '푸시 알림 발송',
            message: `총 ${targetUsers.length}명에게 푸시 알림을 발송하시겠습니까?`,
        });
        if (!ok)
            return;
        setLoading(true);
        try {
            const payload = {
                legalClass,
                userIds: targetUsers.map(u => u.id),
                title: data.title,
                message: data.message,
            };
            const result = await AdminService.pushNotifications.sendBulkNotification(payload);
            toast.success(`푸시 알림 발송 완료 - 성공: ${result.successCount}건, 실패: ${result.failureCount}건, 총 대상: ${result.totalCount}건`);
            reset({ title: '', message: '' });
            setTargetUsers([]);
        }
        catch (error: any) {
            if (error?.response?.status === 401) {
                toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
                window.location.href = '/';
            }
            else {
                const errorMessage = error?.response?.data?.message || error?.response?.data?.error || '푸시 알림 발송에 실패했습니다.';
                toast.error(errorMessage);
            }
        }
        finally {
            setLoading(false);
        }
    });
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
            toast.error('추가할 사용자가 없습니다.');
            return;
        }
        const ok = await confirmAction({
            title: '발송 대상자 추가',
            message: `총 ${totalCount}명의 사용자를 발송 대상자 리스트에 추가하시겠습니까?`,
        });
        if (!ok)
            return;
        setLoading(true);
        try {
            const cleanFilters: any = {};
            if (filters.isDormant)
                cleanFilters.isDormant = true;
            if (filters.gender)
                cleanFilters.gender = filters.gender;
            if (filters.universities.length > 0)
                cleanFilters.universities = filters.universities;
            if (filters.regions.length > 0)
                cleanFilters.regions = filters.regions;
            if (filters.ranks.length > 0)
                cleanFilters.ranks = filters.ranks;
            if (filters.phoneNumber)
                cleanFilters.phoneNumber = filters.phoneNumber;
            if (filters.hasPreferences !== undefined)
                cleanFilters.hasPreferences = filters.hasPreferences;
            const allUsers: FilteredUser[] = [];
            const totalPagesToFetch = Math.ceil(totalCount / itemsPerPage);
            for (let page = 1; page <= totalPagesToFetch; page++) {
                const data = await AdminService.pushNotifications.filterUsers(cleanFilters, page, itemsPerPage);
                allUsers.push(...data.users);
            }
            const newTargetUsers = [...targetUsers];
            let addedCount = 0;
            allUsers.forEach(user => {
                if (!newTargetUsers.find(u => u.id === user.id)) {
                    newTargetUsers.push(user);
                    addedCount++;
                }
            });
            setTargetUsers(newTargetUsers);
            toast.success(`${addedCount}명이 발송 대상자 리스트에 추가되었습니다. (중복 ${allUsers.length - addedCount}명 제외)`);
        }
        catch {
            toast.error('사용자 추가에 실패했습니다.');
        }
        finally {
            setLoading(false);
        }
    };
    const removeFromTargetUsers = (userId: string) => {
        setTargetUsers(prev => prev.filter(u => u.id !== userId));
    };
    const clearTargetUsers = async () => {
        const ok = await confirmAction({
            title: '목록 초기화',
            message: '발송 대상자 리스트를 전체 초기화하시겠습니까?',
        });
        if (!ok)
            return;
        setTargetUsers([]);
    };
    return (<div className="space-y-6">
      <h1 className="text-2xl font-bold">푸시 알림 관리</h1>

      {/* 필터링 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">사용자 필터링</h2>

        <div className="space-y-4">
          {/* 휴면 유저 */}
          <div className="flex items-center">
            <Checkbox id="isDormant" isSelected={filters.isDormant} className="mr-2" onChange={checked => setFilters({ ...filters, isDormant: checked })}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
            <label htmlFor="isDormant">휴면 유저 (남성, 최근 7일 미접속)</label>
          </div>

          {/* 성별 */}
          <div>
            <label className="block mb-2 font-medium">성별</label>
            <Select value={filters.gender} onChange={(key) => {
            const value = String(key ?? "");
            setFilters({ ...filters, gender: value });
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              <ListBox.Item id={"MALE"} textValue={"\uB0A8\uC131"}>남성</ListBox.Item>
              <ListBox.Item id={"FEMALE"} textValue={"\uC5EC\uC131"}>여성</ListBox.Item>
            </ListBox></Select.Popover></Select>
          </div>

          {/* 대학교 */}
          <div>
            <label className="block mb-2 font-medium">대학교</label>

            {filters.universities.length > 0 && (<div className="mb-2 flex flex-wrap gap-2">
                {filters.universities.map(university => (<span key={university} className="inline-flex items-center bg-[#ffd1da] text-[#6540BD] px-3 py-1 rounded-full text-sm">
                    {university}
                    <Button onPress={() => toggleUniversity(university)} className="ml-2 text-[#7A4AE2] hover:text-[#6540BD]" variant="secondary">
                      ×
                    </Button>
                  </span>))}
              </div>)}

            <div className="relative university-search-container">
              <Input type="text" placeholder="대학교 검색..." value={universitySearch} onChange={(e) => {
            setUniversitySearch(e.target.value);
            setShowUniversityDropdown(true);
        }} onFocus={() => setShowUniversityDropdown(true)} className="border rounded px-3 py-2 w-full"></Input>

              {showUniversityDropdown && (<div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                  {filteredUniversities.length > 0 ? (filteredUniversities.map(university => (<Button key={university} onPress={() => {
                    toggleUniversity(university);
                    setUniversitySearch('');
                    setShowUniversityDropdown(false);
                  }} variant="tertiary" className={`w-full justify-start px-3 py-2 ${filters.universities.includes(university) ? 'bg-[#f7f7f7]' : ''}`}>
                    {university}
                    {filters.universities.includes(university) && <span className="ml-2">선택됨</span>}
                  </Button>))) : (<div className="px-3 py-2 text-gray-500">검색 결과가 없습니다</div>)}
                </div>)}
            </div>
          </div>

          {/* 지역 */}
          <div>
            <label className="block mb-2 font-medium">지역</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {regionOptions.map(region => (<Checkbox key={region.code} isSelected={filters.regions.includes(region.code)} onChange={checked => toggleRegion(region.code)} className="flex items-center"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>

                  {region.name}
                </Checkbox.Content></Checkbox>))}
            </div>
          </div>

          {/* 외모 등급 */}
          <div>
            <label className="block mb-2 font-medium">외모 등급</label>
            <div className="flex gap-4">
              {ranks.map(rank => (<Checkbox key={rank} isSelected={filters.ranks.includes(rank)} onChange={checked => toggleRank(rank)} className="flex items-center"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>

                  {rank}
                </Checkbox.Content></Checkbox>))}
            </div>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block mb-2 font-medium">전화번호</label>
            <Input type="text" value={filters.phoneNumber} onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            setFilters({ ...filters, phoneNumber: formatted });
        }} placeholder="010-1234-5678" className="border rounded px-3 py-2 w-full" maxLength={13}></Input>
          </div>

          {/* 프로필 정보 입력 유무 */}
          <div>
            <label className="block mb-2 font-medium">프로필 정보 입력 유무</label>
            <Select value={filters.hasPreferences === undefined ? '' : filters.hasPreferences.toString()} onChange={(key) => {
            const value = String(key ?? "");
            setFilters({
                ...filters,
                hasPreferences: value
                    === '' ? undefined : value
                    === 'true'
            });
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              <ListBox.Item id={"true"} textValue={"\uC785\uB825 \uC644\uB8CC"}>입력 완료</ListBox.Item>
              <ListBox.Item id={"false"} textValue={"\uBBF8\uC785\uB825"}>미입력</ListBox.Item>
            </ListBox></Select.Popover></Select>
          </div>

          <div className="flex gap-4">
            <Button onPress={() => handleFilterUsers(1)} isDisabled={loading} className="bg-[#7A4AE2] text-white px-6 py-2 rounded hover:bg-[#7A4AE2] disabled:bg-gray-400" variant="secondary">
              {loading ? '조회 중...' : '사용자 검색'}
            </Button>

            {totalCount > 0 && (<Button onPress={addToTargetUsers} isDisabled={loading} className="bg-[#7A4AE2] text-white px-6 py-2 rounded hover:bg-[#7A4AE2] disabled:bg-gray-400" variant="secondary">
                {loading ? '추가 중...' : `발송 대상자 리스트에 추가 (${totalCount}명)`}
              </Button>)}
          </div>

          {totalCount > 0 && (<div className="mt-4">
              <div className="p-4 bg-[#f7f7f7] rounded mb-4">
                <p className="font-semibold">검색 결과: 총 {totalCount}명</p>
                <p className="text-sm text-gray-600">현재 페이지: {filteredUsers.length}명</p>
              </div>

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
                    {filteredUsers.map((user) => (<tr key={user.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <Button isIconOnly variant="tertiary" aria-label={`${user.name} 프로필 보기`} onPress={() => handleViewProfile(user.id)} className="h-10 w-10 rounded-full p-0">
                        {user.profileImageUrl ? <img src={user.profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="text-xs text-gray-500">없음</span>}
                      </Button>
                        </td>
                        <td className="px-4 py-2">{user.name}</td>
                        <td className="px-4 py-2">{user.gender === 'MALE' ? '남성' : '여성'}</td>
                        <td className="px-4 py-2 text-xs text-gray-500">{user.id}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (<div className="mt-4 flex items-center justify-center gap-2">
                  <Button onPress={() => handlePageChange(1)} isDisabled={currentPage === 1} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" variant="secondary">
                    처음
                  </Button>
                  <Button onPress={() => handlePageChange(currentPage - 1)} isDisabled={currentPage === 1} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" variant="secondary">
                    이전
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                        pageNum = i + 1;
                    }
                    else if (currentPage <= 3) {
                        pageNum = i + 1;
                    }
                    else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                    }
                    else {
                        pageNum = currentPage - 2 + i;
                    }
                    return (<Button key={pageNum} onPress={() => handlePageChange(pageNum)} className={`px-3 py-1 border rounded ${currentPage === pageNum
                            ? 'bg-[#7A4AE2] text-white'
                            : 'hover:bg-gray-100'}`} variant="secondary">
                          {pageNum}
                        </Button>);
                })}
                  </div>

                  <Button onPress={() => handlePageChange(currentPage + 1)} isDisabled={currentPage === totalPages} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" variant="secondary">
                    다음
                  </Button>
                  <Button onPress={() => handlePageChange(totalPages)} isDisabled={currentPage === totalPages} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" variant="secondary">
                    마지막
                  </Button>

                  <span className="ml-4 text-sm text-gray-600">
                    {currentPage} / {totalPages} 페이지
                  </span>
                </div>)}
            </div>)}
        </div>
      </div>

      {/* 발송 대상자 리스트 섹션 */}
      {targetUsers.length > 0 && (<div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">발송 대상자 리스트 ({targetUsers.length}명)</h2>
            <Button onPress={clearTargetUsers} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" variant="secondary">
              전체 초기화
            </Button>
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
                {targetUsers.map((user) => (<tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Button isIconOnly variant="tertiary" aria-label={`${user.name} 프로필 보기`} onPress={() => handleViewProfile(user.id)} className="h-10 w-10 rounded-full p-0">
                        {user.profileImageUrl ? <img src={user.profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="text-xs text-gray-500">없음</span>}
                      </Button>
                    </td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.gender === 'MALE' ? '남성' : '여성'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{user.id}</td>
                    <td className="px-4 py-2">
                      <Button onPress={() => removeFromTargetUsers(user.id)} className="text-red-500 hover:text-red-700 text-sm" variant="secondary">
                        제거
                      </Button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* 푸시 알림 발송 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">푸시 알림 발송</h2>

        <div className="space-y-4">
          <div>
            <RadioGroup value={legalClass} onChange={value => setLegalClass(value as PushLegalClass)} orientation="horizontal" isRequired><Label>발송 분류</Label><Radio value="advertising"><Radio.Content><Radio.Control><Radio.Indicator /></Radio.Control><Label>광고성 (이벤트·혜택·재방문 유도)</Label></Radio.Content></Radio><Radio value="informational"><Radio.Content><Radio.Control><Radio.Indicator /></Radio.Control><Label>정보성 (공지·거래·서비스 안내)</Label></Radio.Content></Radio></RadioGroup><p className="text-sm text-gray-600">광고성은 수신 동의한 회원에게만 발송되고 제목 앞에 (광고)가 붙습니다. 21시~08시에는 야간 동의 회원에게만 갑니다.</p><label className="block mb-2 font-medium">제목</label>
            <Controller name="title" control={control} render={({ field, fieldState }) => (<>
                  <Input {...field} type="text" placeholder="푸시 알림 제목" className={`border rounded px-3 py-2 w-full ${fieldState.error ? 'border-red-500' : ''}`}></Input>
                  {fieldState.error && (<p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>)}
                </>)}></Controller>
          </div>

          <div>
            <label htmlFor="pushMessage" className="block mb-2 font-medium">메시지</label>
            <Controller name="message" control={control} render={({ field, fieldState }) => (<>
                  <TextArea {...field} id="pushMessage" placeholder="푸시 알림 메시지" rows={4} className={`border rounded px-3 py-2 w-full ${fieldState.error ? 'border-red-500' : ''}`}></TextArea>
                  {fieldState.error && (<p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>)}
                </>)}></Controller>
          </div>

          <Button onPress={() => void handleSendPushNotification()} isDisabled={isSubmitting || loading || targetUsers.length === 0} className="bg-[#7A4AE2] text-white px-6 py-2 rounded hover:bg-[#7A4AE2] disabled:bg-gray-400" variant="secondary">
            {isSubmitting || loading ? '발송 중...' : `푸시 알림 발송 (총 ${targetUsers.length}명)`}
          </Button>
        </div>
      </div>

      {/* 프로필 상세 모달 */}
      {showProfileModal && (<Modal.Backdrop isOpen onOpenChange={open => { if (!open) closeProfileModal(); }}><Modal.Container size="lg"><Modal.Dialog style={{width:"100%",maxWidth:672,minWidth:0}} aria-label="프로필 상세 정보" className="p-6"><Modal.Body>
            {loadingProfile ? (<div className="text-center py-8">
                <p>프로필 정보를 불러오는 중...</p>
              </div>) : selectedUser ? (<div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">프로필 상세 정보</h2>
                  <Button onPress={closeProfileModal} className="text-gray-500 hover:text-gray-700 text-2xl" variant="secondary">
                    ×
                  </Button>
                </div>

                {selectedUser.profileImages && selectedUser.profileImages.length > 0 && (<div className="mb-6">
                    <h3 className="font-semibold mb-2">프로필 이미지</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedUser.profileImages.map((img, idx) => (<img key={idx} src={img} alt={`프로필 ${idx + 1}`} className="w-full h-40 object-cover rounded"></img>))}
                    </div>
                  </div>)}

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                  {selectedUser.introduction && (<div>
                      <p className="text-sm text-gray-600">자기소개</p>
                      <p className="font-semibold">{selectedUser.introduction}</p>
                    </div>)}

                  <div>
                    <p className="text-sm text-gray-600">가입일</p>
                    <p className="font-semibold">{safeToLocaleDateString(selectedUser.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">사용자 ID</p>
                    <p className="font-semibold text-xs text-gray-500">{selectedUser.id}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onPress={closeProfileModal} className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600" variant="secondary">
                    닫기
                  </Button>
                </div>
              </div>) : (<div className="text-center py-8">
                <p>프로필 정보를 불러올 수 없습니다.</p>
              </div>)}
          </Modal.Body></Modal.Dialog></Modal.Container></Modal.Backdrop>)}
    </div>);
}
export default PushSendTab;
