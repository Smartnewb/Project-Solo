'use client';

import Link from 'next/link';
import { Avatar, Box, Button, Chip, Divider, Paper, Typography } from '@mui/material';
import {
	AccountCircle as AccountCircleIcon,
	OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import type { GhostChatSession, GhostChatSessionContext } from '@/app/types/ghost-chat';

interface GhostContextPanelProps {
	session: GhostChatSession | null;
	context: GhostChatSessionContext | null;
}

function FieldRow({ label, value }: { label: string; value: string | number | null | undefined }) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
				{value ?? '없음'}
			</Typography>
		</Box>
	);
}

function joinValues(values: Array<string | number | null | undefined>) {
	const present = values.filter((value): value is string | number => value !== null && value !== undefined && value !== '');
	return present.length > 0 ? present.join(' · ') : null;
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
			<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
				{title}
			</Typography>
			{children}
		</Box>
	);
}

export default function GhostContextPanel({ session, context }: GhostContextPanelProps) {
	if (!session) {
		return (
			<Box
				sx={{
					height: '100%',
					borderLeft: { md: 1 },
					borderColor: 'divider',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'text.secondary',
					p: 2,
					textAlign: 'center',
				}}
			>
				<Typography variant="body2">세션을 선택하면 운영 컨텍스트가 표시됩니다.</Typography>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				height: '100%',
				borderLeft: { md: 1 },
				borderColor: 'divider',
				overflowY: 'auto',
				p: 2,
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
			}}
		>
			<Typography variant="h6" sx={{ fontWeight: 700 }}>
				컨텍스트
			</Typography>

			<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
				<Section title="Ghost 프로필">
					{context?.ghost ? (
						<>
							<Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
								<Avatar
									src={context.ghost.primaryPhotoUrl ?? undefined}
									alt={context.ghost.name}
									sx={{ width: 48, height: 48 }}
								>
									{context.ghost.name.charAt(0)}
								</Avatar>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
										{context.ghost.name}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										상대 노출명: {context.ghost.anonymousName}
									</Typography>
								</Box>
							</Box>
							<FieldRow
								label="기본 정보"
								value={joinValues([context.ghost.age, context.ghost.gender, context.ghost.mbti, context.ghost.rank])}
							/>
							<FieldRow
								label="학교/학과"
								value={joinValues([context.ghost.university?.name, context.ghost.department?.name])}
							/>
							<FieldRow label="소개" value={context.ghost.introduction} />
							{context.ghost.keywords && context.ghost.keywords.length > 0 && (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
									{context.ghost.keywords.map((keyword) => (
										<Chip key={keyword} label={keyword} size="small" variant="outlined" />
									))}
								</Box>
							)}
							<Button
								component={Link}
								href={`/admin/ai-profiles/ghosts?ghostAccountId=${encodeURIComponent(session.ghostAccountId)}`}
								target="_blank"
								rel="noreferrer"
								size="small"
								variant="outlined"
								startIcon={<AccountCircleIcon fontSize="small" />}
								endIcon={<OpenInNewIcon fontSize="small" />}
								sx={{ alignSelf: 'flex-start' }}
							>
								Ghost 프로필 확인
							</Button>
						</>
					) : (
						<Typography variant="body2" color="text.secondary">
							프로필 컨텍스트를 불러오는 중입니다.
						</Typography>
					)}
				</Section>
			</Paper>

			<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
				<Section title="Target 유저">
					{context?.target && (
						<>
							<FieldRow
								label="기본 정보"
								value={joinValues([context.target.age, context.target.gender, context.target.mbti, context.target.rank])}
							/>
							<FieldRow
								label="학교/학과"
								value={joinValues([context.target.university?.name, context.target.department?.name])}
							/>
							<Button
								component={Link}
								href={`/admin/users?userId=${encodeURIComponent(session.targetUserId)}`}
								target="_blank"
								rel="noreferrer"
								size="small"
								variant="outlined"
								startIcon={<AccountCircleIcon fontSize="small" />}
								endIcon={<OpenInNewIcon fontSize="small" />}
								sx={{ alignSelf: 'flex-start' }}
							>
								상대 프로필 확인
							</Button>
						</>
					)}
				</Section>
			</Paper>

			<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
				<Section title="운영 안전장치">
					<FieldRow label="assignedAdminId" value={session.assignedAdminId} />
					<FieldRow label="assignedAt" value={session.assignedAt} />
					<FieldRow label="userMessageCount" value={session.userMessageCount} />
					<FieldRow label="adminMessageCount" value={session.adminMessageCount} />
					<FieldRow label="closedReason" value={session.closedReason} />
				</Section>
			</Paper>

			<Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
				<Section title="노출 안전">
					<FieldRow
						label="상대방에게 보이는 이름"
						value={context?.visibility.targetSeesGhostName ?? context?.ghost.anonymousName}
					/>
					<FieldRow
						label="실명 노출 차단"
						value={context?.visibility.realGhostNameHiddenFromTarget ? '활성' : '확인 필요'}
					/>
				</Section>
			</Paper>

			<Divider />
			<Typography variant="caption" color="text.secondary">
				운영자 화면에는 Ghost 실제 프로필을 보여주고, 유저 화면에는 anonymousName 계약을 사용합니다.
			</Typography>
		</Box>
	);
}
