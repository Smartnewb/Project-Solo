'use client';
import { Button, Checkbox, Chip } from '@heroui/react';
import {
	Eye as ViewIcon,
	EyeOff as BlindIcon,
	Flame as HotIcon,
	Heart as LikeIcon,
	Images as ImagesIcon,
	Inbox as MoveIcon,
	MessageCircle as CommentIcon,
	Trash2 as DeleteIcon,
} from 'lucide-react';
import { safeToLocaleDateString } from '@/app/utils/formatters';

/** 목록 API(`/admin/v2/community/posts`)가 내려주는 필드 중 카드가 쓰는 것만 정의한다. */
export interface ArticleCardData {
	id: string;
	title?: string | null;
	content?: string | null;
	emoji?: string | null;
	anonymous?: string | null;
	userId?: string | null;
	author?: { id?: string; name?: string } | null;
	categoryName?: string | null;
	likeCount?: number;
	commentCount?: number;
	readCount?: number;
	reportCount?: number;
	isBlinded?: boolean;
	blindedAt?: string | Date | null;
	isHot?: boolean;
	imageUrls?: string[];
	imageCount?: number;
	createdAt?: string | Date;
}

interface ArticleCardProps {
	article: ArticleCardData;
	selected: boolean;
	actionLoading: boolean;
	onSelect: () => void;
	onOpen: () => void;
	onOpenAuthor: (userId: string) => void;
	onPreviewImages: (urls: string[]) => void;
	onToggleHot: () => void;
	onToggleBlind: () => void;
	onMoveCategory: () => void;
	onDelete: () => void;
}

/** "방금 전 / n분 전 / n시간 전 / 날짜" — 앱 커뮤니티 목록과 같은 읽힘. */
function formatRelativeTime(value: string | Date | undefined): string {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
	if (diffMin < 1) return '방금 전';
	if (diffMin < 60) return `${diffMin}분 전`;
	if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`;
	return safeToLocaleDateString(value);
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
	return (
		<span className="inline-flex items-center gap-1 text-gray-500" title={label} aria-label={`${label} ${value}`}>
			{icon}
			<span className="text-sm tabular-nums">{value}</span>
		</span>
	);
}

export function ArticleCard({
	article,
	selected,
	actionLoading,
	onSelect,
	onOpen,
	onOpenAuthor,
	onPreviewImages,
	onToggleHot,
	onToggleBlind,
	onMoveCategory,
	onDelete,
}: ArticleCardProps) {
	const blinded = Boolean(article.isBlinded || article.blindedAt);
	const imageUrls = article.imageUrls ?? [];
	const thumbnail = imageUrls[0];
	const extraCount = Math.max((article.imageCount ?? imageUrls.length) - 1, 0);
	const authorId = article.author?.id ?? article.userId ?? undefined;
	const authorLine = `${article.anonymous || '익명'}${article.author?.name ? ` · ${article.author.name}` : ''}`;
	const authorInitial = (article.anonymous || article.author?.name || '익').slice(0, 1);
	const title = article.title?.trim() || '제목 없음';

	return (
		<article
			className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition ${
				selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
			} ${blinded ? 'opacity-70' : ''}`}
		>
			<div className="flex items-start gap-3">
				<div className="pt-1">
					<Checkbox isSelected={selected} onChange={onSelect} aria-label="게시글 선택">
						<Checkbox.Content>
							<Checkbox.Control>
								<Checkbox.Indicator />
							</Checkbox.Control>
						</Checkbox.Content>
					</Checkbox>
				</div>

				<button
					type="button"
					onClick={onOpen}
					className="min-w-0 flex-1 cursor-pointer text-left"
					aria-label={`${title} 상세 보기`}
				>
					<div className="mb-1 flex flex-wrap items-center gap-1">
						{article.categoryName ? <Chip size="sm">{article.categoryName}</Chip> : null}
						{article.isHot ? (
							<Chip size="sm" className="bg-orange-100 text-orange-600">
								인기
							</Chip>
						) : null}
						{blinded ? <Chip size="sm">블라인드</Chip> : null}
						{(article.reportCount ?? 0) > 0 ? (
							<Chip size="sm" className="bg-red-100 text-red-600">
								신고 {article.reportCount}
							</Chip>
						) : null}
					</div>
					<p className="line-clamp-2 text-base font-bold leading-snug text-gray-900">{title}</p>
					<p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600">
						{article.emoji ? `${article.emoji} ` : ''}
						{article.content}
					</p>
				</button>

				{thumbnail ? (
					<button
						type="button"
						onClick={() => onPreviewImages(imageUrls)}
						className="relative h-24 w-24 shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-gray-100"
						aria-label={`사진 ${article.imageCount ?? imageUrls.length}장 보기`}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
						{extraCount > 0 ? (
							<span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
								<ImagesIcon size={12} />+{extraCount}
							</span>
						) : null}
					</button>
				) : null}
			</div>

			<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
				<div className="flex min-w-0 items-center gap-2 text-sm">
					<span
						className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-black text-purple-700"
						aria-hidden="true"
					>
						{authorInitial}
					</span>
					{authorId ? (
						<button
							type="button"
							onClick={() => onOpenAuthor(authorId)}
							className="min-w-0 max-w-[180px] cursor-pointer truncate font-semibold text-gray-800 hover:underline"
							title={`작성자 프로필 보기 (${authorId})`}
						>
							{authorLine}
						</button>
					) : (
						<span className="truncate font-semibold text-gray-800">{authorLine}</span>
					)}
					<span className="text-gray-300">·</span>
					<span className="shrink-0 text-gray-500">{formatRelativeTime(article.createdAt)}</span>
				</div>

				<div className="flex items-center gap-3">
					<Stat icon={<ViewIcon size={15} />} value={article.readCount ?? 0} label="조회" />
					<Stat icon={<LikeIcon size={15} />} value={article.likeCount ?? 0} label="좋아요" />
					<Stat icon={<CommentIcon size={15} />} value={article.commentCount ?? 0} label="댓글" />
				</div>
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					variant={article.isHot ? 'primary' : 'secondary'}
					isDisabled={actionLoading}
					onPress={onToggleHot}
				>
					<HotIcon size={14} />
					{article.isHot ? '인기글 내리기' : '인기글로 올리기'}
				</Button>
				<Button size="sm" variant="secondary" isDisabled={actionLoading} onPress={onToggleBlind}>
					{blinded ? <ViewIcon size={14} /> : <BlindIcon size={14} />}
					{blinded ? '블라인드 해제' : '블라인드'}
				</Button>
				<Button size="sm" variant="secondary" isDisabled={actionLoading} onPress={onMoveCategory}>
					<MoveIcon size={14} />
					카테고리 이전
				</Button>
				<Button size="sm" variant="tertiary" isDisabled={actionLoading} onPress={onDelete}>
					<DeleteIcon size={14} />
					삭제
				</Button>
			</div>
		</article>
	);
}
