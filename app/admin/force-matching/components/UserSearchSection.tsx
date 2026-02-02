'use client';

import { useState, useCallback } from 'react';
import { AdminUserListItem } from '../types';
import AdminService from '@/app/services/admin';
import SelectedUserCard from './SelectedUserCard';

interface UserSearchSectionProps {
	gender: 'male' | 'female';
	selectedUser: AdminUserListItem | null;
	onSelectUser: (user: AdminUserListItem | null) => void;
}

export default function UserSearchSection({
	gender,
	selectedUser,
	onSelectUser,
}: UserSearchSectionProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState<AdminUserListItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	const genderLabel = gender === 'male' ? '남성' : '여성';
	const headerBgColor = gender === 'male' ? 'bg-blue-500' : 'bg-pink-500';

	const handleSearch = useCallback(async () => {
		if (!searchTerm.trim()) return;

		setIsLoading(true);
		setHasSearched(true);
		try {
			const response = await AdminService.forceMatching.searchUsers({
				search: searchTerm.trim(),
				gender,
				status: 'APPROVED',
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
		<div className="bg-white rounded-lg shadow overflow-hidden">
			{/* 헤더 */}
			<div className={`${headerBgColor} text-white px-4 py-3`}>
				<h3 className="font-semibold">{genderLabel} 유저 검색</h3>
			</div>

			<div className="p-4 space-y-4">
				{/* 선택된 유저 */}
				<SelectedUserCard
					user={selectedUser}
					gender={gender}
					onClear={() => onSelectUser(null)}
				/>

				{/* 검색 입력 */}
				<div className="flex gap-2">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="이름, 이메일, 전화번호로 검색"
						className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
					/>
					<button
						onClick={handleSearch}
						disabled={isLoading || !searchTerm.trim()}
						className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isLoading ? '검색 중...' : '검색'}
					</button>
				</div>

				{/* 검색 결과 */}
				{hasSearched && (
					<div className="border rounded-lg max-h-64 overflow-y-auto">
						{isLoading ? (
							<div className="p-4 text-center text-gray-500">검색 중...</div>
						) : searchResults.length > 0 ? (
							<ul className="divide-y">
								{searchResults.map((user) => (
									<li
										key={user.userId}
										onClick={() => handleSelectUser(user)}
										className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
									>
										<div className="flex items-center gap-3">
											{user.profileImageUrl ? (
												<img
													src={user.profileImageUrl}
													alt={user.name}
													className="w-10 h-10 rounded-full object-cover"
												/>
											) : (
												<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
													<span className="text-gray-400">
														{user.name?.[0] || '?'}
													</span>
												</div>
											)}
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<p className="font-medium text-gray-900 truncate">
														{user.name}
													</p>
													{user.isFaker && (
														<span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded flex-shrink-0">
															테스트
														</span>
													)}
												</div>
												<p className="text-sm text-gray-500 truncate">
													{user.age ? `${user.age}세` : ''}{' '}
													{user.universityName || ''}
												</p>
											</div>
											<span className="text-xs text-gray-400 flex-shrink-0">
												{user.phoneNumber}
											</span>
										</div>
									</li>
								))}
							</ul>
						) : (
							<div className="p-4 text-center text-gray-500">검색 결과가 없습니다</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
