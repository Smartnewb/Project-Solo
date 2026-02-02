'use client';

import { AdminUserListItem } from '../types';

interface SelectedUserCardProps {
	user: AdminUserListItem | null;
	gender: 'male' | 'female';
	onClear: () => void;
}

export default function SelectedUserCard({ user, gender, onClear }: SelectedUserCardProps) {
	const genderLabel = gender === 'male' ? '남성' : '여성';
	const bgColor = gender === 'male' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200';
	const textColor = gender === 'male' ? 'text-blue-600' : 'text-pink-600';

	if (!user) {
		return (
			<div className={`border-2 border-dashed rounded-lg p-4 ${bgColor}`}>
				<p className={`text-center ${textColor}`}>{genderLabel} 유저를 선택해주세요</p>
			</div>
		);
	}

	return (
		<div className={`border rounded-lg p-4 ${bgColor}`}>
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					{user.profileImageUrl ? (
						<img
							src={user.profileImageUrl}
							alt={user.name}
							className="w-12 h-12 rounded-full object-cover"
						/>
					) : (
						<div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
							<span className="text-gray-400 text-lg">{user.name?.[0] || '?'}</span>
						</div>
					)}
					<div>
						<div className="flex items-center gap-2">
							<p className="font-semibold text-gray-900">{user.name}</p>
							{user.isFaker && (
								<span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
									테스트
								</span>
							)}
						</div>
						<p className="text-sm text-gray-500">
							{user.age ? `${user.age}세` : ''} {user.universityName || ''}
						</p>
						<p className="text-xs text-gray-400">{user.phoneNumber}</p>
					</div>
				</div>
				<button
					onClick={onClear}
					className="text-gray-400 hover:text-gray-600 transition-colors"
					title="선택 해제"
				>
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
