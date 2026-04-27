import type { MatchStatus } from '../lib/preview-simulation';

const LABELS: Record<MatchStatus, { text: string; variant: 'primary' | 'secondary' | 'disabled' }> =
	{
		PENDING: { text: '좋아요 대기 중', variant: 'disabled' },
		OPEN: { text: '나에게 좋아요를 보냈어요!', variant: 'primary' },
		IN_CHAT: { text: '채팅방으로 이동', variant: 'secondary' },
		REJECTED: { text: '내가 좋아요를 보냈어요', variant: 'secondary' },
	};

export function PreviewBottomLikeBar({ matchStatus }: { matchStatus: MatchStatus }) {
	const { text, variant } = LABELS[matchStatus];
	const cls =
		variant === 'primary'
			? 'bg-purple-600 text-white'
			: variant === 'secondary'
				? 'bg-slate-100 text-slate-600'
				: 'bg-slate-200 text-slate-400';

	return (
		<div
			className="sticky bottom-0 mx-4 my-4 cursor-not-allowed rounded-xl px-4 py-3 text-center text-sm font-semibold"
			title="운영자 미리보기 모드 — 클릭 비활성"
		>
			<div className={`rounded-xl py-3 ${cls}`}>{text}</div>
		</div>
	);
}
