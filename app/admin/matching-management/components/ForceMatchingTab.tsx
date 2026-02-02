'use client';

import { useState, useCallback } from 'react';
import {
	Box,
	Paper,
	Typography,
	CircularProgress,
	Alert,
	Avatar,
} from '@mui/material';
import { Button } from '@/shared/ui';
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
		maleUser: { id: string; name: string; country: string };
		femaleUser: { id: string; name: string; country: string };
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
		if (!searchTerm.trim()) return;

		setIsLoading(true);
		setHasSearched(true);
		try {
			const response = await AdminService.forceMatching.searchUsers({
				search: searchTerm.trim(),
				gender,
				status: 'approved',
				page: 1,
				limit: 10,
			});
			setSearchResults(response.users || []);
		} catch (error) {
			console.error('유저 검색 중 오류:', error);
			setSearchResults([]);
		} finally {
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

	return (
		<Paper sx={{ overflow: 'hidden' }}>
			<Box sx={{ bgcolor: headerBgColor, color: 'white', px: 2, py: 1.5 }}>
				<Typography fontWeight="bold">{genderLabel} 유저 검색</Typography>
			</Box>

			<Box sx={{ p: 2 }}>
				{/* 선택된 유저 */}
				<Box
					sx={{
						bgcolor: cardBgColor,
						border: selectedUser ? '1px solid' : '2px dashed',
						borderColor: gender === 'male' ? '#93c5fd' : '#f9a8d4',
						borderRadius: 1,
						p: 2,
						mb: 2,
					}}
				>
					{selectedUser ? (
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
								<Avatar src={selectedUser.profileImageUrl} sx={{ width: 48, height: 48 }}>
									{selectedUser.name?.[0]}
								</Avatar>
								<Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Typography fontWeight="bold">{selectedUser.name}</Typography>
										{selectedUser.isFaker && (
											<Box
												component="span"
												sx={{
													px: 0.75,
													py: 0.25,
													bgcolor: '#fef3c7',
													color: '#92400e',
													fontSize: '0.75rem',
													borderRadius: 0.5,
												}}
											>
												테스트
											</Box>
										)}
									</Box>
									<Typography variant="body2" color="text.secondary">
										{selectedUser.age ? `${selectedUser.age}세` : ''} {selectedUser.universityName || ''}
									</Typography>
									<Typography variant="caption" color="text.disabled">
										{selectedUser.phoneNumber}
									</Typography>
								</Box>
							</Box>
							<Button variant="ghost" size="sm" onClick={() => onSelectUser(null)}>
								✕
							</Button>
						</Box>
					) : (
						<Typography
							sx={{ textAlign: 'center', color: gender === 'male' ? '#3b82f6' : '#ec4899' }}
						>
							{genderLabel} 유저를 선택해주세요
						</Typography>
					)}
				</Box>

				{/* 검색 입력 */}
				<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="이름, 이메일, 전화번호로 검색"
						className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<Button onClick={handleSearch} disabled={isLoading || !searchTerm.trim()}>
						{isLoading ? '검색 중...' : '검색'}
					</Button>
				</Box>

				{/* 검색 결과 */}
				{hasSearched && (
					<Box
						sx={{
							border: '1px solid #e5e7eb',
							borderRadius: 1,
							maxHeight: 256,
							overflow: 'auto',
						}}
					>
						{isLoading ? (
							<Box sx={{ p: 2, textAlign: 'center' }}>
								<CircularProgress size={20} />
							</Box>
						) : searchResults.length > 0 ? (
							searchResults.map((user) => (
								<Box
									key={user.userId}
									onClick={() => handleSelectUser(user)}
									sx={{
										p: 1.5,
										display: 'flex',
										alignItems: 'center',
										gap: 1.5,
										cursor: 'pointer',
										borderBottom: '1px solid #f3f4f6',
										'&:hover': { bgcolor: '#f9fafb' },
										'&:last-child': { borderBottom: 'none' },
									}}
								>
									<Avatar src={user.profileImageUrl} sx={{ width: 40, height: 40 }}>
										{user.name?.[0]}
									</Avatar>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Typography fontWeight="medium" noWrap>
												{user.name}
											</Typography>
											{user.isFaker && (
												<Box
													component="span"
													sx={{
														px: 0.75,
														py: 0.25,
														bgcolor: '#fef3c7',
														color: '#92400e',
														fontSize: '0.75rem',
														borderRadius: 0.5,
														flexShrink: 0,
													}}
												>
													테스트
												</Box>
											)}
										</Box>
										<Typography variant="body2" color="text.secondary" noWrap>
											{user.age ? `${user.age}세` : ''} {user.universityName || ''}
										</Typography>
									</Box>
									<Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
										{user.phoneNumber}
									</Typography>
								</Box>
							))
						) : (
							<Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
								검색 결과가 없습니다
							</Typography>
						)}
					</Box>
				)}
			</Box>
		</Paper>
	);
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
		} catch (err: any) {
			console.error('강제 매칭 생성 중 오류:', err);
			const errorMessage =
				err.response?.data?.message || err.message || '강제 매칭 생성 중 오류가 발생했습니다';
			setError(errorMessage);
		} finally {
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

	return (
		<Box>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				관리자가 두 명의 유저를 선택하여 강제로 채팅방을 생성합니다.
			</Typography>

			{/* 유저 검색 섹션 */}
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
				<UserSearchSection gender="male" selectedUser={maleUser} onSelectUser={setMaleUser} />
				<UserSearchSection gender="female" selectedUser={femaleUser} onSelectUser={setFemaleUser} />
			</Box>

			{/* 매칭 정보 및 생성 버튼 */}
			<Paper sx={{ p: 3 }}>
				<Typography variant="h6" gutterBottom>
					매칭 정보
				</Typography>

				{/* 선택된 유저 요약 */}
				{(maleUser || femaleUser) && (
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, py: 3 }}>
						{maleUser ? (
							<Box sx={{ textAlign: 'center' }}>
								<Avatar
									src={maleUser.profileImageUrl}
									sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: '#dbeafe' }}
								>
									{maleUser.profileImageUrl ? null : '👨'}
								</Avatar>
								<Typography fontWeight="medium" variant="body2">
									{maleUser.name}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{maleUser.age ? `${maleUser.age}세` : ''} {maleUser.universityName || ''}
								</Typography>
							</Box>
						) : (
							<Box sx={{ textAlign: 'center' }}>
								<Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: '#f3f4f6' }}>?</Avatar>
								<Typography variant="body2" color="text.disabled">
									남성 미선택
								</Typography>
							</Box>
						)}

						<Typography variant="h4">💕</Typography>

						{femaleUser ? (
							<Box sx={{ textAlign: 'center' }}>
								<Avatar
									src={femaleUser.profileImageUrl}
									sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: '#fce7f3' }}
								>
									{femaleUser.profileImageUrl ? null : '👩'}
								</Avatar>
								<Typography fontWeight="medium" variant="body2">
									{femaleUser.name}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{femaleUser.age ? `${femaleUser.age}세` : ''} {femaleUser.universityName || ''}
								</Typography>
							</Box>
						) : (
							<Box sx={{ textAlign: 'center' }}>
								<Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: '#f3f4f6' }}>?</Avatar>
								<Typography variant="body2" color="text.disabled">
									여성 미선택
								</Typography>
							</Box>
						)}
					</Box>
				)}

				{/* 생성 사유 입력 */}
				<Box sx={{ mb: 2 }}>
					<Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
						생성 사유 (선택)
					</Typography>
					<textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="강제 매칭 사유를 입력하세요 (선택사항)"
						rows={2}
						className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
					/>
				</Box>

				{/* 에러 메시지 */}
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{/* 생성 버튼 */}
				<Button
					onClick={handleCreateMatch}
					disabled={!validation.valid || isLoading}
					className="w-full"
				>
					{isLoading ? (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<CircularProgress size={20} color="inherit" />
							생성 중...
						</Box>
					) : (
						'강제 매칭 생성'
					)}
				</Button>
			</Paper>

			{/* 결과 모달 */}
			{result && result.success && result.data && (
				<Box
					sx={{
						position: 'fixed',
						inset: 0,
						bgcolor: 'rgba(0,0,0,0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 9999,
					}}
				>
					<Paper sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
						<Box sx={{ bgcolor: '#22c55e', color: 'white', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
							<span>✓</span>
							<Typography fontWeight="bold">강제 매칭 완료</Typography>
						</Box>
						<Box sx={{ p: 3 }}>
							<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
								<Box sx={{ textAlign: 'center' }}>
									<Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1, bgcolor: '#dbeafe' }}>👨</Avatar>
									<Typography fontWeight="medium" variant="body2">
										{result.data.maleUser.name}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{result.data.maleUser.country.toUpperCase()}
									</Typography>
								</Box>
								<Typography variant="h5">💕</Typography>
								<Box sx={{ textAlign: 'center' }}>
									<Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1, bgcolor: '#fce7f3' }}>👩</Avatar>
									<Typography fontWeight="medium" variant="body2">
										{result.data.femaleUser.name}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{result.data.femaleUser.country.toUpperCase()}
									</Typography>
								</Box>
							</Box>

							<Box sx={{ bgcolor: '#f9fafb', borderRadius: 1, p: 2, mb: 2 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
									<Typography variant="body2" color="text.secondary">
										채팅방 ID
									</Typography>
									<Typography variant="body2" fontFamily="monospace">
										{result.data.chatRoomId}
									</Typography>
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
									<Typography variant="body2" color="text.secondary">
										매칭 ID
									</Typography>
									<Typography variant="body2" fontFamily="monospace">
										{result.data.matchId}
									</Typography>
								</Box>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography variant="body2" color="text.secondary">
										생성 시간
									</Typography>
									<Typography variant="body2">
										{new Date(result.data.createdAt).toLocaleString('ko-KR')}
									</Typography>
								</Box>
							</Box>

							<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
								채팅방이 생성되었습니다. 두 유저가 채팅을 시작할 수 있습니다.
							</Typography>

							<Button onClick={handleCloseResult} className="w-full">
								확인
							</Button>
						</Box>
					</Paper>
				</Box>
			)}
		</Box>
	);
}
