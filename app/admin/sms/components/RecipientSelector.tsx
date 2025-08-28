// TITLE : - 사용자 검색
'use client'

import { useState } from 'react';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { User } from '../types';
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
const MOCK_USERS: User[] = [
    {
        userId: '1',
        name: '이민지',
        phoneNumber: '010-0000-0000',
        gender: 'female',
        lastLoginAt: '2024-01-12',
    },
    {
        userId: '2',
        name: '사민경',
        phoneNumber: '010-9876-5432',
        gender: 'female',
        lastLoginAt: '2024-01-14',
    },
    {
        userId: '3',
        name: '유재윤',
        phoneNumber: '010-5555-1234',
        gender: 'male',
        lastLoginAt: '2024-01-13',
    },
    {
        userId: '4',
        name: '최은기',
        phoneNumber: '010-5555-1234',
        gender: 'male',
        lastLoginAt: '2024-01-13',
    },
];


// MARK: - 발송 대상 선택 컴포넌트
export function RecipientSelector( { onRecipientsChange } : RecipientSelectorProps) {
    // === 상태관리 ===
    const [recentActivity, setRecentActivity] = useState<string>('all');   
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined}>({
            from: undefined,
            to: undefined,
        });
    
    // NOTE: 사용자 정의 확인 필요
    const [gender, setGender] = useState<'all' | 'female' | 'male' | 'custom'>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // 팝오버 상태 추가
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    // === 사용자 검색 ===
    const handleSearch = async () => {
        if (!searchTerm.trim()) return ;

        setLoading(true);

        try {
            // TODO: API 대신 목업 데이터에서 검색
            const results = MOCK_USERS.filter(user => 
                user.name.includes(searchTerm) || 
                user.phoneNumber.includes(searchTerm)
            );
            
            // MARK: - API 호출(사용자 검색)
            // TODO: - 목업 삭제 후  주석 해제
            // const results = await smsService.searchUser({
            //     startDate: dateRange.from
            //         ? format(dateRange.from,'yyyy-mm-dd') 
            //         : undefined,

            //     endDate: dateRange.to
            //     ? format(dateRange.to, 'yyyy-mm-dd')
            //     : undefined,

            //     gender: gender !== 'all' && gender !== 'custom' 
            //         ? gender.toUpperCase() as 'male' | 'female'
            //         : undefined,
            //     searchTerm: searchTerm,
            // });
            
            // 선택된 사용자 필터링
            const filteredResults = results.filter(
                user => !selectedUsers.find(selected => selected.userId === user.userId)
            )

            // 필터링 결과 저장
            setSearchResults(filteredResults);

        } catch(error) {
            console.error('사용자 검색 실패:',error);

        } finally {
            setLoading(false);
        }

    };

    // === 사용자 추가 ===
    const handleAddUser = async (user: User) => {
        if (!selectedUsers.find(u => u.userId ===user.userId)) {
            const updatedUsers = [...selectedUsers, user];
            setSelectedUsers(updatedUsers);
            onRecipientsChange?.(updatedUsers);
            setSearchResults(searchResults.filter(u => u.userId !== user.userId));
        }
    };
    

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
                

                {/* MARK: - 최근 활동 드롭다운 */}
                <div className='mb-6'>
                    {/* TODO: 스타일 클래스 설정 */}
                    <label className='block text-sm font-medium text-[#111827] mb-2'>최근 활동</label>
                    <select
                        value={recentActivity}
                        onChange={(e) => setRecentActivity(e.target.value)}
                        className='w-full px-3 py-2 border-[1px] border-[#D1D5DB] rounded-md'>
                        <option>전체</option>
                        <option>3일전</option>
                        <option>7일전</option>
                        <option>21일전</option>
                        <option>30일전</option>
                        <option>60일전</option>
                    </select>
                </div>


                {/* MARK: - 날짜 범위 */}
                {/* TODO:
                - 컴포넌트 구현 
                - 스타일 클래스 설정*/}
                
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-[#111827] mb-2'>날짜범위(최근접속일)</label>
                    <div className='flex gap-2 items-center'>
                        {/* 시작일 */}
                        <Popover 
                            open={startDateOpen}
                            onOpenChange={setStartDateOpen}>
                            <PopoverTrigger asChild>
                                <button className='flex-1 px-3 py-2 text-left border border-[#D1D5DB] rounded-md text-sm hover:bg-gray-50  items-center justify-between'>
                                    <span className={dateRange.from ? '' : 'text-gray-400'}>
                                        {dateRange.from ? (
                                            format(dateRange.from, 'yyyy-MM-dd')
                                        ) : ('시작일')}
                                    </span>
                                </button>
                            </PopoverTrigger>

                            <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                    mode='single'
                                    selected={dateRange.from}
                                    onSelect={(date) =>
                                        setDateRange(prev => ({...prev, from: date}))
                                    }
                                    locale={ko}
                                    modifiersStyles={{
                                        today : {
                                            backgroundColor: 'transparent',
                                            
                                        }
                                    }}
                                    initialFocus />
                                    {/* 버튼 영역 */}
                                <div className='p-3 border-t flex justify-end gap-2 '>
                                    <button
                                        onClick={() => {
                                            setDateRange(prev => ({...prev, from: undefined}));
                                            setStartDateOpen(false);
                                        }}
                                        className='px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-md border
                                        border-gray-200' >취소</button>
                                    <button
                                        onClick={() => {
                                            
                                            setStartDateOpen(false);
                                        }}
                                        className='px-3 py-1.5 text-sm text-white font-medium hover:bg-purple-700 rounded-md bg-[#7D4EE4]'>확인</button>
                                    
                                </div>
                            </PopoverContent>

                            

                        </Popover>

                        {/* 종료일 */}
                        <Popover
                            open={endDateOpen}
                            onOpenChange={setEndDateOpen}>
                            <PopoverTrigger asChild>
                                <button className='flex-1 px-3 py-2 text-left border border-[#D1D5DB] rounded-md text-sm hover:bg-gray-50 items-center justify-between'>
                                    <span className={dateRange.to ? '' : 'text-gray-400'}>
                                        {dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '종료일'}
                                    </span>
                                </button>
                            </PopoverTrigger>

                            <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                    mode='range'
                                    selected={{
                                        from: dateRange.from,
                                        to: dateRange.to
                                    }}
                                    onSelect={(range) => {
                                        if (range?.to) {
                                            // 종료일만 업데이트
                                            setDateRange(prev => ({
                                                ...prev,
                                                to: range.to
                                            }));
                                        } 
                                    }}
                                    modifiersStyles={{
                                        today: {
                                            backgroundColor: 'transparent',
                                        }
                                    }}
                                    locale={ko}
                                    disabled={(date) => 
                                        dateRange.from ? date < dateRange.from : false
                                    }
                                    initialFocus/>

                                    <div className='border-t flex justify-end gap-2 p-3'>
                                        <button
                                            onClick={() => {
                                                setDateRange(prev => ({...prev, from: undefined}));
                                                setEndDateOpen(false);
                                            }}
                                            className='px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-md border
                                            border-gray-200' >취소</button>
                                        <button
                                            onClick={() => setEndDateOpen(false)}
                                            className='px-3 py-1.5 text-sm text-white font-medium hover:bg-purple-700 rounded-md bg-[#7D4EE4]'>확인</button>
                                    </div>
                            </PopoverContent>
                        </Popover>

                    </div>
                </div>

                {/* MARK: - 성별 */}
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-[#111827] mb-2'>성별</label>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                        {(['all', 'female', 'male', 'custom'] as const).map((value)=>(
                            <button
                            key={value}
                            onClick={() => setGender(value)}
                            className={`px-3 py-2 rounded-md transition-colors ${
                                gender == value
                                ? 'bg-purple-600 text-white border-purple-600'
                                // FIXME: 호버 시, 색상 변경 필요
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
                    {/* 검색 입력 창 */}
                    <div className='relative mb-3'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400'/>
                        <input 
                            type='text'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder='이름 또는 전화번호로 검색'
                            className='w-full pl-10 pr-3 py-2 border-[1px] border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#885BEB]'/>
                        
                        {loading && (
                            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                                <div className='animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent'></div>
                            </div>
                        )}
                    </div>

                    {/* 검색 결과 */}
                    {searchResults.length > 0 && (
                        <div className='mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-md'>
                        {searchResults.map((user) => (
                            <div
                                key={user.userId}
                                className='flex items-center justify-between p-3  border-b last:border-b-0'>
                            
                            {/* 사용자 정보 */}
                            <div>
                                <p className='text-sm font-medium'>{user.name}</p>
                                <p className='text-xs text-gray-500'>{user.phoneNumber} • {user.gender === 'male' ? '남성' : '여성'}</p>
                            </div>
                            {/* 버튼*/}
                            <button 
                                onClick={() => handleAddUser(user)}
                                className='p-2 bg-[#6B7280] hover:bg-purple-700 rounded-full border border-[#E5E7EB]'>
                                {/* 버튼 아이콘 */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none">
                                    <path d="M6.40625 0.875C6.40625 0.460156 6.07109 0.125 5.65625 0.125C5.24141 0.125 4.90625 0.460156 4.90625 0.875V4.25H1.53125C1.11641 4.25 0.78125 4.58516 0.78125 5C0.78125 5.41484 1.11641 5.75 1.53125 5.75H4.90625V9.125C4.90625 9.53984 5.24141 9.875 5.65625 9.875C6.07109 9.875 6.40625 9.53984 6.40625 9.125V5.75H9.78125C10.1961 5.75 10.5312 5.41484 10.5312 5C10.5312 4.58516 10.1961 4.25 9.78125 4.25H6.40625V0.875Z" fill="white"/>
                                </svg>

                            </button>
                            </div>
                        ))}
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
                                        <path d="M8.68574 3.52974C8.97871 3.23677 8.97871 2.76099 8.68574 2.46802C8.39277 2.17505 7.91699 2.17505 7.62402 2.46802L5.15605 4.93833L2.68574 2.47036C2.39277 2.17739 1.91699 2.17739 1.62402 2.47036C1.33105 2.76333 1.33105 3.23911 1.62402 3.53208L4.09434 6.00005L1.62637 8.47036C1.3334 8.76333 1.3334 9.23911 1.62637 9.53208C1.91934 9.82505 2.39512 9.82505 2.68809 9.53208L5.15605 7.06177L7.62637 9.52974C7.91934 9.8227 8.39512 9.8227 8.68809 9.52974C8.98106 9.23677 8.98106 8.76099 8.68809 8.46802L6.21777 6.00005L8.68574 3.52974Z" fill="#6B7280"/>
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