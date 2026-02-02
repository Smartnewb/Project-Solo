'use client';

import { useState } from 'react';
import { AdminUserListItem, CreateForceChatRoomResponse } from './types';
import UserSearchSection from './components/UserSearchSection';
import ForceMatchingResult from './components/ForceMatchingResult';
import AdminService from '@/app/services/admin';

export default function ForceMatchingPage() {
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
				err.response?.data?.message ||
				err.message ||
				'강제 매칭 생성 중 오류가 발생했습니다';
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
		<div className="space-y-6">
			{/* 페이지 헤더 */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">강제 매칭 (채팅방 생성)</h1>
				<p className="mt-1 text-sm text-gray-500">
					관리자가 두 명의 유저를 선택하여 강제로 채팅방을 생성합니다.
				</p>
			</div>

			{/* 유저 검색 섹션 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<UserSearchSection
					gender="male"
					selectedUser={maleUser}
					onSelectUser={setMaleUser}
				/>
				<UserSearchSection
					gender="female"
					selectedUser={femaleUser}
					onSelectUser={setFemaleUser}
				/>
			</div>

			{/* 매칭 정보 및 생성 버튼 */}
			<div className="bg-white rounded-lg shadow p-6 space-y-4">
				<h3 className="font-semibold text-gray-900">매칭 정보</h3>

				{/* 선택된 유저 요약 */}
				{(maleUser || femaleUser) && (
					<div className="flex items-center justify-center gap-6 py-4">
						{maleUser ? (
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2 overflow-hidden">
									{maleUser.profileImageUrl ? (
										<img
											src={maleUser.profileImageUrl}
											alt={maleUser.name}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-blue-600 text-xl">👨</span>
									)}
								</div>
								<p className="font-medium text-sm">{maleUser.name}</p>
								<p className="text-xs text-gray-500">
									{maleUser.age ? `${maleUser.age}세` : ''}{' '}
									{maleUser.universityName || ''}
								</p>
							</div>
						) : (
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
									<span className="text-gray-400">?</span>
								</div>
								<p className="text-sm text-gray-400">남성 미선택</p>
							</div>
						)}

						<div className="text-2xl">💕</div>

						{femaleUser ? (
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2 overflow-hidden">
									{femaleUser.profileImageUrl ? (
										<img
											src={femaleUser.profileImageUrl}
											alt={femaleUser.name}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-pink-600 text-xl">👩</span>
									)}
								</div>
								<p className="font-medium text-sm">{femaleUser.name}</p>
								<p className="text-xs text-gray-500">
									{femaleUser.age ? `${femaleUser.age}세` : ''}{' '}
									{femaleUser.universityName || ''}
								</p>
							</div>
						) : (
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
									<span className="text-gray-400">?</span>
								</div>
								<p className="text-sm text-gray-400">여성 미선택</p>
							</div>
						)}
					</div>
				)}

				{/* 생성 사유 입력 */}
				<div>
					<label
						htmlFor="reason"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						생성 사유 (선택)
					</label>
					<textarea
						id="reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="강제 매칭 사유를 입력하세요 (선택사항)"
						rows={2}
						className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT resize-none"
					/>
				</div>

				{/* 에러 메시지 */}
				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-3">
						<p className="text-red-600 text-sm">{error}</p>
					</div>
				)}

				{/* 유효성 경고 */}
				{!validation.valid && maleUser && femaleUser && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
						<p className="text-yellow-700 text-sm">{validation.message}</p>
					</div>
				)}

				{/* 생성 버튼 */}
				<button
					onClick={handleCreateMatch}
					disabled={!validation.valid || isLoading}
					className="w-full py-3 bg-primary-DEFAULT text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isLoading ? (
						<span className="flex items-center justify-center gap-2">
							<svg
								className="animate-spin h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							생성 중...
						</span>
					) : (
						'강제 매칭 생성'
					)}
				</button>
			</div>

			{/* 결과 모달 */}
			{result && <ForceMatchingResult result={result} onClose={handleCloseResult} />}
		</div>
	);
}
