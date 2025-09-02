// TITLE : - 사용자 검색
'use client'

import { useState, useEffect, use } from 'react';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { User, UserSearchResponse } from '../types';
import { smsService } from '@/app/services/sms';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { Calendar } from '@/shared/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/shared/ui/popover';



// MARK: - props
interface RecipientSelectorProps {
    onRecipientsChange?: (recipient: User[]) => void; // 선택된 수신자 변경시 호출되는 콜백
}

// NOTE: - 추후 삭제
// MARK: - 목업 데이터
// const MOCK_USERS: User[] = [
//     {
//         userId: '1',
//         name: '이민지',
//         phoneNumber: '010-0000-0000',
//         gender: 'female',
//         lastLoginAt: '2024-01-12',
//     },
//     {
//         userId: '2',
//         name: '사민경',
//         phoneNumber: '010-9876-5432',
//         gender: 'female',
//         lastLoginAt: '2024-01-14',
//     },
//     {
//         userId: '3',
//         name: '유재윤',
//         phoneNumber: '010-5555-1234',
//         gender: 'male',
//         lastLoginAt: '2024-01-13',
//     },
//     {
//         userId: '4',
//         name: '최은기',
//         phoneNumber: '010-5555-1234',
//         gender: 'male',
//         lastLoginAt: '2024-01-13',
//     },
// ];


// MARK: - 발송 대상 선택 컴포넌트
export function RecipientSelector({ onRecipientsChange }: RecipientSelectorProps) {
    // === 상태관리 ===
    const [recentActivity, setRecentActivity] = useState<string>('all');
    // NOTE: 미사용 - 캘린더 범위 지정
    // const [dateRange, setDateRange] = useState<{
    //     from: Date | undefined;
    //     to: Date | undefined
    // }>({
    //     from: undefined,
    //     to: undefined,
    // });
    const [criteriaDate, setCriteriaDate] = useState<Date | undefined>(undefined); // 기준 날짜
    const [checkedUser, setCheckedUser] = useState<Set<string>>(new Set()); // 선택된 사용자 ID 추적
    const [checkedSelectedUser, setCheckedSelectedUser] = useState<Set<string>>(new Set());


    // NOTE: 사용자 정의 확인 필요
    const [gender, setGender] = useState<'ALL' | 'FEMALE' | 'MALE' | 'CUSTOM'>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [includeWithdrawn, setIncludeWithdrawn] = useState<boolean>(false); // 사용자 상태
    const [includedRejected, setIncludedRejected] = useState<boolean>(false); // 승인 거부

    const [criteriaDateOpen, setCriteriaDateOpen] = useState(false);
    // NOTE: 미사용 - 범위 팝오버 상태 추가
    // const [startDateOpen, setStartDateOpen] = useState(false);
    // const [endDateOpen, setEndDateOpen] = useState(false);

    // === 사용자 검색 ===
    // const handleSearch = async () => {
    //     setLoading(true);

    //     try {
    //         const [activeUsers, rejectedUsers, withdrawnUsers] = await Promise.all([
    //             // 활성 사용자 검색
    //             smsService.searchUser({
    //                 startDate: dateRange.from 
    //                     ? format(dateRange.from, 'yyyy-MM-dd')
    //                     : undefined,
    //                 endDate: dateRange.to
    //                     ? format(dateRange.to, 'yyyy-MM-dd')
    //                     : undefined,
    //                 gender: gender !== 'ALL' && gender ! == 'CUSTOM'
    //                     ? gender as 'MALE' | 'FEMALE'
    //                     : undefined,
    //                 searchTerm: searchTerm,
    //                 includeWithdrawn: false, // 사용자 상태(false: 활성)
    //                 includeRejected: false, // 승인 거부 사용자 필터(false: 승인 거부 사용자 제외, true: 포함)
    //             }),

    //             // 승인 거부 사용자 검색
    //             smsService.searchUser({
    //                 startDate: dateRange.from 
    //                     ? format(dateRange.from, 'yyyy-MM-dd')
    //                     : undefined,
    //                 endDate: dateRange.to
    //                     ? format(dateRange.to, 'yyyy-MM-dd')
    //                     : undefined,
    //                 gender: gender !== 'ALL' && gender ! == 'CUSTOM'
    //                     ? gender as 'MALE' | 'FEMALE'
    //                     : undefined,
    //                 searchTerm: searchTerm,
    //                 includeWithdrawn: false, // 사용자 상태(false: 활성)
    //                 includeRejected: true, // 승인 거부 사용자 필터(false: 승인 거부 사용자 제외, true: 포함)
    //             }),

    //             // 탈퇴 사용자
    //             smsService.searchUser({
    //                 startDate: dateRange.from 
    //                     ? format(dateRange.from, 'yyyy-MM-dd')
    //                     : undefined,
    //                 endDate: dateRange.to
    //                     ? format(dateRange.to, 'yyyy-MM-dd')
    //                     : undefined,
    //                 gender: gender !== 'ALL' && gender ! == 'CUSTOM'
    //                     ? gender as 'MALE' | 'FEMALE'
    //                     : undefined,
    //                 searchTerm: searchTerm,
    //                 includeWithdrawn: true, // 사용자 상태(false: 활성)
    //                 includeRejected: false, // 승인 거부 사용자 필터(false: 승인 거부 사용자 제외, true: 포함)
    //             }),
    //         ]);



    //         const allUsers = [...activeUsers, ...rejectedUsers, ...withdrawnUsers];


    //         // 중복 제거
    //         const uniqueUsers = allUsers.filter((user, index, self) =>
    //             index === self.findIndex(u => u.userId === user.userId)
    //         );

    //         // 체크박스 필터링
    //         let filteredUsers = uniqueUsers;
    //         if (!includeWithdrawn && !includedRejected) {
    //             filteredUsers = activeUsers; // 활성 사용자
    //         } else if (includeWithdrawn && !includedRejected) {
    //             filteredUsers = [...activeUsers, ...withdrawnUsers] // 탈퇴 사용자 포함
    //         } else if (!includeWithdrawn && includedRejected) {
    //             filteredUsers = [...activeUsers, ...rejectedUsers]; // 승인 거부 사용자 포함
    //         } else {
    //             // NOTE: - 모든 사용자
    //         }

    //         const results = filteredUsers.filter(
    //             user => !selectedUsers.find(selected => selected.userId === user.userId));
    //         setSearchResults(results);
    //         console.log('검색 결과 :',results.length);


    //     } catch(error) {
    //         console.error('사용자 검색 실패 : ',error);
    //     } finally {
    //         setLoading(false);
    //     }

    // };
    const handleSearch = async () => {
        setLoading(true);

        try {
            // API 호출 - 응답 타입이 UserSearchResponse
            const response: UserSearchResponse = await smsService.searchUser({
                startDate: criteriaDate ? format(criteriaDate, 'yyyy-MM-dd') : undefined, // NOTE: 캘린더 사용시 criteriaDate를 dateRange.from 으로 변경
                // endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined, // NOTE: 미사용 - 날짜 범위 지정용
                gender: gender !== 'ALL' && gender !== 'CUSTOM'
                    ? gender as 'MALE' | 'FEMALE'
                    : undefined,
                searchTerm: searchTerm,
                includeWithdrawn: includeWithdrawn,
                includeRejected: includedRejected,
                
            });

            console.log('=== API 응답 ===');
            console.log('전체 응답:', response);
            console.log('사용자 배열:', response.users);
            console.log('사용자 수:', response.users.length);
            console.log('전체 카운트:', response.meta.totalCount);

            // users 배열에서 필터링
            const filteredResults = response.users.filter(
                user => !selectedUsers.find(selected => selected.userId === user.userId)
            );

            setSearchResults(filteredResults);
            setTotalCount(response.meta.totalCount);  // totalCount 상태 업데이트

        } catch (error) {
            console.error('사용자 검색 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // === 개별 사용자 추가 ===
    const handleAddUser = async (user: User) => {
        if (!selectedUsers.find(u => u.userId === user.userId)) {
            const updatedUsers = [...selectedUsers, user];
            setSelectedUsers(updatedUsers);
            onRecipientsChange?.(updatedUsers);
            setSearchResults(searchResults.filter(u => u.userId !== user.userId));
        }
    };

    // === 사용자 일괄 추가 ===
    const handleAddAll = () => {
        // 체크된 사용자 필터링
        const usersToAdd = searchResults.filter(user =>
            checkedUser.has(user.userId)
        );

        const newUsers = usersToAdd.filter(user =>
            !selectedUsers.find(u => u.userId === user.userId)
        );

        const updatedUsers = [...selectedUsers, ...newUsers];
        setSelectedUsers(updatedUsers);
        onRecipientsChange?.(updatedUsers)

        // 추가된 사용
        setSearchResults(prev =>
            prev.filter(u => !checkedUser.has(u.userId))
        );

        setCheckedUser(new Set());



    };

    // === 추가된 사용자 일괄 제거 ===
    const handleRemoveCheckedSelectedUser = () => {
        setSearchResults(prev => [...prev, ...selectedUsers]);
        setSelectedUsers([]);
        onRecipientsChange?.([]);
        setCheckedSelectedUser(new Set());
    };

    // === 사용자 일괄 체크 ===
    const handleSelectAll = async (checked: boolean) => {
        // 일괄 체크
        if (checked) {
            const allUser = new Set(searchResults.map(user => user.userId));
            setCheckedUser(allUser);
        } else {
            // 일괄 해제
            setCheckedUser(new Set());

        }
    };

    // === 사용자 일괄 체크 해제 ===
    const handleClearSelection = () => {
        setCheckedUser(new Set());
    };

    // === 사용자 개별 체크 ===
    const handleSelectUser = (userId: string, checked: boolean) => {
        setCheckedUser(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(userId);
            } else {
                newSet.delete(userId);
            }
            return newSet;
        })
    };

    // === 성별 필터링 ===
    useEffect(() => {
        handleSearch();
    }, [gender]);

    // NOTE: 미사용 - 날짜 범위 지정 시
    // useEffect(() => {
    //     if (dateRange.from || dateRange.to) {
    //         handleSearch();
    //     }
    // }, [dateRange.from, dateRange.to]);

    useEffect(() => {
        if (criteriaDate) {
            handleSearch();
        }
    }, [criteriaDate]);


    useEffect(() => {
        handleSearch();
    }, []);

    // === 활동일 기준 필터링 === 
    useEffect(() => {
        if (recentActivity !== 'all') {
            handleSearch();
        }
    }, [recentActivity]);

    // === 사용자 상태, 승인 거부 핸들러 ===
    useEffect(() => {
        handleSearch();
    }, [includeWithdrawn, includedRejected]);

    // === 사용자 제거 ===
    const handleRemoveUser = (userId: string) => {
        const updatedUsers = selectedUsers.filter(u => u.userId !== userId);

        // 상태 업데이트
        setSelectedUsers(updatedUsers);

        // 부모 컴포넌트에 알림
        onRecipientsChange?.(updatedUsers);

    };

    // ===  Enter 키 입력 처리 ===
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(); // 검색 실행
        }
    };


    // === JSX ===
    return (
        <>
            {/* MARK: - 발송 대상 컨테이너 */}
            <div className='border-[1px] border-[#D1D5DB] bg-white rounded-lg p-4 sm:p-6 mb-6'>
                {/* MARK: - 컴포넌트 제목 */}
                <h3 className='text-lg font-medium text-[#111827] mb-4'>
                    발송 대상 선택
                </h3>

                {/* 활동 기준일 */}
                {/* 비활성 사용자 기준일 - 캘린더 스타일 */}
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-[#111827] mb-2'> 비활성 사용자 기준일 (해당 날짜 이전에 마지막 활동한 사용자 조회)</label>
                    <div className='flex gap-2 items-center'>
                        <Popover
                            open={criteriaDateOpen}
                            onOpenChange={setCriteriaDateOpen}>
                            <PopoverTrigger asChild>
                                <button className={`flex-1 flex px-3 py-2 text-left border rounded-md text-sm items-center justify-between
                                    ${criteriaDateOpen
                                    ? 'border-[#7D4EE4]'
                                    : 'border-[#D1D5DB]'}`}>
                                    <span className={
                                        criteriaDate 
                                        ? ''
                                        : 'text-gray-400'}>
                                        {criteriaDate ? format(criteriaDate, 'yyyy-MM-dd') : '기준일 선택'}
                                    </span>
                                </button>
                            </PopoverTrigger>

                            <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                    mode='single'
                                    selected={criteriaDate}
                                    onSelect={(date) => setCriteriaDate(date)}
                                    locale={ko}
                                    modifiersStyles={{
                                        today: {
                                            backgroundColor: 'transparent',
                                        }
                                    }}
                                    initialFocus />
                                    {/* 버튼 영역 */}
                                    <div className='p-3 border-t flex justify-end gap-2'>
                                        <button
                                            onClick={() => {
                                                setCriteriaDate(undefined);
                                                setCriteriaDateOpen(false);
                                            }}
                                            className='px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-md border border-gray-200'>취소</button>
                                        <button
                                            onClick={() => setCriteriaDateOpen(false)}
                                            className='px-3 py-1.5 text-sm text-white font-medium hover:bg-purple-700 rounded-md bg-[#7D4EE4]'>확인</button>
                                    </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>선택한 날짜 이전에 마지막 활동한 사용자 + 한 번도 활동하지 않은 사용자가 조회됩니다</p>
                </div>

                {/* MARK: - 성별 */}
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-[#111827] mb-2'>성별</label>
                    <div className='flex flex-wrap gap-2'>
                        {(['all', 'female', 'male', 'custom'] as const).map((value) => (
                            <button
                                key={value}
                                onClick={() => setGender(value.toUpperCase() as 'ALL' | 'FEMALE' | 'MALE' | 'CUSTOM')}
                                className={`px-3 py-2 rounded-md transition-colors ${gender.toLowerCase() === value  // 비교 시 소문자로 변환
                                    ? 'bg-[#885AEB] text-white border-purple-600'
                                    : 'border-[1px] border-[#D1D5DB] bg-white text-[#374151] hover:bg-gray-50'
                                    } `}>
                                {value === 'all' && '전체'}
                                {value === 'female' && '여성'}
                                {value === 'male' && '남성'}
                                {value === 'custom' && '사용자 정의'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MARK: - 사용자 검색 */}
                <div className='mb-4'>
                    <label className='block text-sm font-medium text-[#111827] mb-2'>사용자 검색</label>
                    {/* 검색 필드*/}
                    <div className='flex items-center gap-2 mb-3'>
                        <div className='relative flex-1'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder='이름 또는 전화번호로 검색'
                                className='w-full pl-10 pr-3 py-2 border-[1px] border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#885BEB]' />

                            {loading && (
                                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                                    <div className='animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent'></div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleSearch}
                            className='px-3 py-2 text-sm rounded-md bg-[#885AEB] text-white hover:bg-purple-700 transition-colors'
                        >검색</button>
                    </div>


                    {/* 검색 결과 */}
                    {searchResults.length > 0 && (
                        <div>
                            {/* 체크박스 영역 */}
                            <div className='mb-1'>
                                {/* 활성 사용자 */}
                                <div className='flex items-center gap-2' >
                                    <input
                                        type='checkbox'
                                        id='selectActive'
                                        checked={includeWithdrawn}
                                        onChange={(e) => {
                                            console.log('활성 사용자 조회:',e.target.checked) // 디버깅 용
                                            setIncludeWithdrawn(e.target.checked)}}
                                        className='w-4 h-4 text-[#885AEB] border-gray-300 rounded focus:ring-[#885AEB] cursor-pointer'
                                    />
                                    <label className='text-sm text-gray-700'>탈퇴 사용자 포함</label>
                                </div>
                                {/* 승인 거부 사용자 */}
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        id='selectReject'
                                        checked={includedRejected}
                                        onChange={(e) => {
                                            console.log('미승인 사용자 조회:',e.target.checked)
                                            setIncludedRejected(e.target.checked)}}
                                        className='w-4 h-4 text-[#885AEB] border-gray-300 rounded focus:ring-[#885AEB] cursor-pointer'
                                    />
                                    <label className='text-sm text-gray-700'>승인 거부 사용자 포함</label>
                                </div>

                                {/* 전체 선택 체크박스*/}
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        id='selectAll'
                                        checked={checkedUser.size > 0 &&
                                            checkedUser.size === searchResults.length
                                        }
                                        ref={(el) => {
                                            if (el) {
                                                el.indeterminate = checkedUser.size > 0 &&
                                                    checkedUser.size < searchResults.length;
                                            }
                                        }}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className='w-4 h-4 text-[#885AEB] border-gray-300 rounded focus:ring-[#885AEB] cursor-pointer' />
                                    <label className='text-sm text-gray-700'>일괄 선택</label>

                                    {checkedUser.size > 0 && (
                                        <button
                                            type='button'
                                            onClick={handleClearSelection}
                                            className='text-xs text-[#885AEB]  hover:text-gray-600 underline'>선택 취소</button>
                                    )}
                                </div>
                            </div>

                            {/* 사용자 수 및 일괄 추가 버튼 */}
                                <div>
                                    <div className='flex justify-between items-center'>
                                        <p className='text-xs text-gray-400'>
                                            검색 결과: {totalCount}명
                                        </p>
                                        {/* 일괄 추가 버튼 */}
                                        <div className='flex justify-between items-center gap-2'>
                                            <button
                                                type='button'
                                                onClick={handleAddAll}
                                                className='px-3 py-1.5 text-xs rounded-md bg-[#885AEB] text-white hover:bg-purple-700 transition-colors flex items-center gap-1'>
                                                <Users className='w-3 h-3' />
                                                선택한 {checkedUser.size}명 추가
                                            </button>
                                        </div>
                                    </div>
                                </div>



                            {/* 스크롤 영역 */}
                            <div className='h-[360px] overflow-y-auto p-2'>
                                <div className='grid gap-2'>
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.userId}
                                            className='bg-white rounded-md border border-gray-200 p-3 w-full'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center justify-between gap-4'>
                                                    {/* 체크박스 */}
                                                    <div className='flex items-center'>
                                                        <input
                                                            type='checkbox'
                                                            checked={checkedUser.has(user.userId)}
                                                            onChange={(e) => handleSelectUser(user.userId, e.target.checked)}
                                                            className='w-4 h-4 text-[#885AEB] border-gray-300 rounded focus:ring-[#885AEB] cursor-pointer' />
                                                    </div>
                                                    {/* 사용자 정보 */}
                                                    <div>
                                                        <p className='text-sm font-meduium text-gray-900'>{user.name}</p>
                                                        <p className='text-xs text-gray-500'>{user.phoneNumber} • {user.gender === 'MALE' ? '남성' : '여성'}</p>
                                                    </div>
                                                </div>


                                                {/* 추가 버튼 */}
                                                <button
                                                    onClick={() => handleAddUser(user)}
                                                    className='p-2 bg-[#885AEB] hover:bg-purple-700 rounded-full transition-colors'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none">
                                                        <path d="M6.40625 0.875C6.40625 0.460156 6.07109 0.125 5.65625 0.125C5.24141 0.125 4.90625 0.460156 4.90625 0.875V4.25H1.53125C1.11641 4.25 0.78125 4.58516 0.78125 5C0.78125 5.41484 1.11641 5.75 1.53125 5.75H4.90625V9.125C4.90625 9.53984 5.24141 9.875 5.65625 9.875C6.07109 9.875 6.40625 9.53984 6.40625 9.125V5.75H9.78125C10.1961 5.75 10.5312 5.41484 10.5312 5C10.5312 4.58516 10.1961 4.25 9.78125 4.25H6.40625V0.875Z" fill="white" />
                                                    </svg>
                                                </button>

                                            </div>

                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>
                    )}

                </div>

            </div>

            {/* MARK: - 선택된 사용자 전체 컨테이너 */}
            {selectedUsers.length > 0 && (
                <div className='bg-white border-[1px] rounded-md p-4 sm:p-6'>
                    {/* 헤더 영역 */}
                    <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-medium text-[#111827] mb-4'>선택된 사용자</h3>
                        <span className='text-sm font-medium text-[#6B7280]'>총 {selectedUsers.length}명</span>
                        <button
                            onClick={handleRemoveCheckedSelectedUser}
                            className='px-3 py-1 text-xs text-red-500 border border-red-300 rounded-md hover:bg-red-50 transition-colors'
                        >전체 삭제</button>
                    </div>

                    {/* 선택된 사용자 목록 */}
                    <div className='space-y-2'>
                        {selectedUsers.map((user) => (
                            <div
                                key={user.userId}
                                className='flex items-center justify-between p-3 bg-gray-50 rounded-md'>
                                <span className='text-sm font-[400] text-[#111827]'>{user.name}</span>
                                <button
                                    onClick={() => handleRemoveUser(user.userId)}
                                    className='p-1 hover:bg-gray-200 rounded-full transition-colors'
                                    title='제거'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 10 12" fill="none">
                                        <path d="M8.68574 3.52974C8.97871 3.23677 8.97871 2.76099 8.68574 2.46802C8.39277 2.17505 7.91699 2.17505 7.62402 2.46802L5.15605 4.93833L2.68574 2.47036C2.39277 2.17739 1.91699 2.17739 1.62402 2.47036C1.33105 2.76333 1.33105 3.23911 1.62402 3.53208L4.09434 6.00005L1.62637 8.47036C1.3334 8.76333 1.3334 9.23911 1.62637 9.53208C1.91934 9.82505 2.39512 9.82505 2.68809 9.53208L5.15605 7.06177L7.62637 9.52974C7.91934 9.8227 8.39512 9.8227 8.68809 9.52974C8.98106 9.23677 8.98106 8.76099 8.68809 8.46802L6.21777 6.00005L8.68574 3.52974Z" fill="#6B7280" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>



                </div>
            )}
        </>
    );
}