'use client';
import { Button, Spinner, Input, TextArea } from '@heroui/react';
import { useState, useCallback } from 'react';
import { safeToLocaleString } from '@/app/utils/formatters';
import AdminService from '@/app/services/admin';
interface AdminUserListItem {
    userId: string;
    name: string;
    email?: string;
    phoneNumber: string;
    gender?: string;
    age?: number;
    status: string;
    universityName?: string;
    profileImageUrl?: string;
    createdAt: Date;
    lastLoginAt?: Date;
    isFaker: boolean;
}
interface CreateForceChatRoomResponse {
    success: boolean;
    data: {
        chatRoomId: string;
        matchId: string;
        connectionId: string;
        maleUser: {
            id: string;
            name: string;
            country: string;
        };
        femaleUser: {
            id: string;
            name: string;
            country: string;
        };
        createdAt: string;
        createdBy: string;
    };
}
interface UserSearchSectionProps {
    gender: 'male' | 'female';
    selectedUser: AdminUserListItem | null;
    onSelectUser: (user: AdminUserListItem | null) => void;
}
function UserSearchSection({ gender, selectedUser, onSelectUser }: UserSearchSectionProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<AdminUserListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const genderLabel = gender === 'male' ? '남성' : '여성';
    const headerBgColor = gender === 'male' ? '#3b82f6' : '#ec4899';
    const cardBgColor = gender === 'male' ? '#eff6ff' : '#fdf2f8';
    const handleSearch = useCallback(async () => {
        if (!searchTerm.trim())
            return;
        setIsLoading(true);
        setHasSearched(true);
        try {
            const response = await AdminService.forceMatching.searchUsers({
                search: searchTerm.trim(),
                gender,
                page: 1,
                limit: 10,
            });
            setSearchResults(Array.isArray(response) ? response : (response?.data ?? response?.users ?? []));
        }
        catch (error) {
            setSearchResults([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [searchTerm, gender]);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
    const handleSelectUser = (user: AdminUserListItem) => {
        onSelectUser(user);
        setSearchResults([]);
        setSearchTerm('');
        setHasSearched(false);
    };
    return (<section style={{ overflow: 'hidden' }} className="rounded-xl border bg-white p-4">
			<div style={{ backgroundColor: headerBgColor, color: 'white', paddingInline: 16, paddingBlock: 12 }}>
				<p>{genderLabel} 유저 검색</p>
			</div>

			<div style={{ padding: 16 }}>
				{/* 선택된 유저 */}
				<div style={{ backgroundColor: cardBgColor, border: selectedUser ? '1px solid' : '2px dashed', borderRadius: 1, padding: 16, marginBottom: 16 }}>
					{selectedUser ? (<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
								<img src={selectedUser.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
								<div>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<p>{selectedUser.name}</p>
										{selectedUser.isFaker && (<div style={{ paddingInline: 6, paddingBlock: 2, backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', borderRadius: 0.5 }}>
												테스트
											</div>)}
									</div>
									<p>
										{selectedUser.age ? `${selectedUser.age}세` : ''} {selectedUser.universityName || ''}
									</p>
									<p>
										{selectedUser.phoneNumber}
									</p>
								</div>
							</div>
							<Button onPress={() => onSelectUser(null)} variant="tertiary">
								✕
							</Button>
						</div>) : (<p style={{ textAlign: 'center', color: gender === 'male' ? '#3b82f6' : '#ec4899' }}>
							{genderLabel} 유저를 선택해주세요
						</p>)}
				</div>

				{/* 검색 입력 */}
				<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
					<Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleKeyDown} placeholder="이름, 이메일, 전화번호로 검색" className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4AE2]"></Input>
					<Button onPress={handleSearch} isDisabled={isLoading || !searchTerm.trim()} variant="tertiary">
						{isLoading ? '검색 중...' : '검색'}
					</Button>
				</div>

				{/* 검색 결과 */}
				{hasSearched && (<div style={{ border: '1px solid #e5e7eb', borderRadius: 1, maxHeight: 256, overflow: 'auto' }}>
						{isLoading ? (<div style={{ padding: 16, textAlign: 'center' }}>
								<Spinner size="sm"></Spinner>
							</div>) : searchResults.length > 0 ? (searchResults.map((user) => (<Button variant="tertiary" key={user.userId} onPress={() => handleSelectUser(user)} style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
									<img src={user.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<p>
												{user.name}
											</p>
											{user.isFaker && (<div style={{ paddingInline: 6, paddingBlock: 2, backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', borderRadius: 0.5, flexShrink: 0 }}>
													테스트
												</div>)}
										</div>
										<p>
											{user.age ? `${user.age}세` : ''} {user.universityName || ''}
										</p>
									</div>
									<p style={{ flexShrink: 0 }}>
										{user.phoneNumber}
									</p>
								</Button>))) : (<p style={{ padding: 16, textAlign: 'center', color: "#6b7280" }}>
								검색 결과가 없습니다
							</p>)}
					</div>)}
			</div>
		</section>);
}
export default function ForceMatchingTab() {
    const [maleUser, setMaleUser] = useState<AdminUserListItem | null>(null);
    const [femaleUser, setFemaleUser] = useState<AdminUserListItem | null>(null);
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CreateForceChatRoomResponse | null>(null);
    const canCreateMatch = () => {
        if (!maleUser || !femaleUser) {
            return { valid: false, message: '남성과 여성 유저를 모두 선택해주세요' };
        }
        if (maleUser.userId === femaleUser.userId) {
            return { valid: false, message: '동일한 유저를 선택할 수 없습니다' };
        }
        return { valid: true, message: '' };
    };
    const handleCreateMatch = async () => {
        const validation = canCreateMatch();
        if (!validation.valid) {
            setError(validation.message);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await AdminService.forceMatching.createForceChatRoom({
                userIdA: maleUser!.userId,
                userIdB: femaleUser!.userId,
                reason: reason.trim() || undefined,
            });
            setResult(response);
        }
        catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || '강제 매칭 생성 중 오류가 발생했습니다';
            setError(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCloseResult = () => {
        setResult(null);
        setMaleUser(null);
        setFemaleUser(null);
        setReason('');
    };
    const validation = canCreateMatch();
    return (<div>
			<p style={{ marginBottom: 24 }}>
				관리자가 두 명의 유저를 선택하여 강제로 채팅방을 생성합니다.
			</p>

			{/* 유저 검색 섹션 */}
			<div style={{ display: 'grid', gap: 24, marginBottom: 24 }}>
				<UserSearchSection gender="male" selectedUser={maleUser} onSelectUser={setMaleUser}></UserSearchSection>
				<UserSearchSection gender="female" selectedUser={femaleUser} onSelectUser={setFemaleUser}></UserSearchSection>
			</div>

			{/* 매칭 정보 및 생성 버튼 */}
			<section style={{ padding: 24 }} className="rounded-xl border bg-white p-4">
				<h2 className="text-lg font-semibold">
					매칭 정보
				</h2>

				{/* 선택된 유저 요약 */}
				{(maleUser || femaleUser) && (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, paddingBlock: 24 }}>
						{maleUser ? (<div style={{ textAlign: 'center' }}>
								<img src={maleUser.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
								<p>
									{maleUser.name}
								</p>
								<p>
									{maleUser.age ? `${maleUser.age}세` : ''} {maleUser.universityName || ''}
								</p>
							</div>) : (<div style={{ textAlign: 'center' }}>
								<span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">?</span>
								<p>
									남성 미선택
								</p>
							</div>)}

						<p>💕</p>

						{femaleUser ? (<div style={{ textAlign: 'center' }}>
								<img src={femaleUser.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
								<p>
									{femaleUser.name}
								</p>
								<p>
									{femaleUser.age ? `${femaleUser.age}세` : ''} {femaleUser.universityName || ''}
								</p>
							</div>) : (<div style={{ textAlign: 'center' }}>
								<span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">?</span>
								<p>
									여성 미선택
								</p>
							</div>)}
					</div>)}

				{/* 생성 사유 입력 */}
				<div style={{ marginBottom: 16 }}>
					<p style={{ marginBottom: 4 }}>
						생성 사유 (선택)
					</p>
					<TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="강제 매칭 사유를 입력하세요 (선택사항)" rows={2} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A4AE2] resize-none"></TextArea>
				</div>

				{/* 에러 메시지 */}
				{error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
						{error}
					</aside>)}

				{/* 생성 버튼 */}
				<Button onPress={handleCreateMatch} isDisabled={!validation.valid || isLoading} className="w-full" variant="tertiary">
					{isLoading ? (<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<Spinner size="sm"></Spinner>
							생성 중...
						</div>) : ('강제 매칭 생성')}
				</Button>
			</section>

			{/* 결과 모달 */}
			{result && result.success && result.data && (<div style={{ position: 'fixed', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
					<section style={{ maxWidth: 400, width: '100%', marginInline: 16 }} className="rounded-xl border bg-white p-4">
						<div style={{ backgroundColor: '#22c55e', color: 'white', paddingInline: 24, paddingBlock: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
							<span>✓</span>
							<p>강제 매칭 완료</p>
						</div>
						<div style={{ padding: 24 }}>
							<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 24 }}>
								<div style={{ textAlign: 'center' }}>
									<span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">👨</span>
									<p>
										{result.data.maleUser.name}
									</p>
									<p>
										{result.data.maleUser.country.toUpperCase()}
									</p>
								</div>
								<h1 className="text-2xl font-bold">💕</h1>
								<div style={{ textAlign: 'center' }}>
									<span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">👩</span>
									<p>
										{result.data.femaleUser.name}
									</p>
									<p>
										{result.data.femaleUser.country.toUpperCase()}
									</p>
								</div>
							</div>

							<div style={{ backgroundColor: '#f9fafb', borderRadius: 1, padding: 16, marginBottom: 16 }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
									<p>
										채팅방 ID
									</p>
									<p>
										{result.data.chatRoomId}
									</p>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
									<p>
										매칭 ID
									</p>
									<p>
										{result.data.matchId}
									</p>
								</div>
								<div style={{ display: 'flex', justifyContent: 'space-between' }}>
									<p>
										생성 시간
									</p>
									<p>
										{safeToLocaleString(result.data.createdAt)}
									</p>
								</div>
							</div>

							<p style={{ textAlign: 'center', marginBottom: 16 }}>
								채팅방이 생성되었습니다. 두 유저가 채팅을 시작할 수 있습니다.
							</p>

							<Button onPress={handleCloseResult} className="w-full" variant="tertiary">
								확인
							</Button>
						</div>
					</section>
				</div>)}
		</div>);
}
