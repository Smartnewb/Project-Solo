'use client';
import { Button, Chip, Modal, TextField, Label, Checkbox, Select, ListBox } from '@heroui/react';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { ProfileImageAuditItem, ProfileImageAuditProfileRank } from '@/app/services/admin';
import { PROFILE_RANK_OPTIONS } from '../constants';
import { formatAuditStatus, formatAgeGender, formatImageKind, formatImageSlot, formatProfileRank, formatReviewedType, formatReviewStatus, formatValidationSummary, parseProfileRank, } from '../profile-image-audit-utils';
import { ProfileImageAuditDetailDrawer } from './ProfileImageAuditDetailDrawer';
import { BlindPhotoComparison } from './BlindPhotoComparison';
type Props = {
    readonly item: ProfileImageAuditItem;
    readonly selected: boolean;
    readonly onToggle: (profileImageId: string) => void;
    readonly onRankChange: (item: ProfileImageAuditItem, rank: ProfileImageAuditProfileRank) => void;
    readonly rankUpdating: boolean;
};
/** 사진은 그대로 두고 위에 검수 결과를 얹는다. 거절은 어둡게 가리고, 정상·2차 검토는 모서리 표시만 한다. */
function AuditStatusOverlay({ item }: { readonly item: ProfileImageAuditItem }) {
    if (item.auditStatus === 'rejected') {
        return (<div data-testid="audit-rejected-overlay" aria-label="거절된 사진" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', backgroundColor: 'rgba(15,23,42,0.6)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>거절됨</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>사진 변경 요청함</span>
            {item.auditDecisionReason && <span style={{ fontSize: 11, opacity: 0.85, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.auditDecisionReason}</span>}
          </div>);
    }
    if (item.auditStatus === 'ok' || item.auditStatus === 'needs_second_review') {
        const secondReview = item.auditStatus === 'needs_second_review';
        return (<span data-testid="audit-status-badge" style={{ position: 'absolute', top: 6, right: 6, zIndex: 2, pointerEvents: 'none', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 800, color: '#fff', backgroundColor: secondReview ? '#d97706' : '#16a34a' }}>
            {secondReview ? '2차 검토' : '정상'}
          </span>);
    }
    return null;
}
/** 운영진이 큐레이팅해 넣은 사진. 등급은 큐레이팅 전 원래 사진으로 매긴 것이라 사진과 등급을 함께 볼 때 구분한다. */
function CurationBadge({ item }: { readonly item: ProfileImageAuditItem }) {
    if (!item.isCurated)
        return null;
    return (<span data-testid="audit-curation-badge" aria-label="큐레이팅 사진" style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 2, pointerEvents: 'none', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 800, color: '#fff', backgroundColor: '#7c3aed' }}>
        ✨큐레이팅
      </span>);
}
/** 큐레이팅으로 교체되기 전 원래 사진. 큐레이팅 사진 옆에 나란히 둔다. */
function CurationOriginalPhoto({ item, onOpen }: { readonly item: ProfileImageAuditItem; readonly onOpen: () => void }) {
    const [failed, setFailed] = useState(false);
    const url = item.curationOriginalImageUrl;
    useEffect(() => setFailed(false), [url]);
    return (<div data-testid="audit-curation-original" style={{ position: 'relative', aspectRatio: '3 / 4', backgroundColor: '#e5e7eb' }}>
        {url && !failed ? (<Button onPress={onOpen} aria-label={`${item.profileImageId} 큐레이팅 전 원본 크게 보기`} style={{ width: '100%', height: '100%', display: 'block' }}>
            <img src={url} alt={`${item.profileImageId} 큐레이팅 전 원본`} loading="lazy" onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
          </Button>) : (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 700 }}>
            {failed ? '원본 로드 실패' : '원본 연결 없음'}
          </div>)}
      </div>);
}
export function ProfileImageAuditCard({ item, selected, onToggle, onRankChange, rankUpdating }: Props) {
    const [src, setSrc] = useState(item.imageUrl);
    const [imageFailed, setImageFailed] = useState(false);
    // 같은 카드 인스턴스가 다른 URL 을 받으면 이전 src/실패 상태가 남지 않게 초기화한다.
    useEffect(() => {
        setSrc(item.imageUrl);
        setImageFailed(false);
    }, [item.imageUrl]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const handleImageError = () => {
        if (item.thumbnailUrl && src !== item.thumbnailUrl) {
            setSrc(item.thumbnailUrl);
            return;
        }
        setImageFailed(true);
    };
    return (<div data-testid="profile-image-audit-card" style={{ boxShadow: selected ? '0 0 0 2px rgba(37,99,235,0.18)' : 'none', overflow: 'hidden' }} className="rounded-xl border p-4">
      {item.presentationMode === 'BLIND' ? <div className="relative">
        <div style={{ position: 'relative' }}>
          <BlindPhotoComparison item={item} />
          <AuditStatusOverlay item={item}></AuditStatusOverlay>
          <CurationBadge item={item}></CurationBadge>
        </div>
        <Button onPress={() => setViewerOpen(true)} variant="tertiary" size="sm" className="mt-2 w-full" aria-label={`${item.profileImageId} 크게 보기`}>나란히 크게 보기</Button>
        {item.selectable !== false && <Checkbox aria-label={`${item.profileImageId} 선택`} isSelected={selected} onChange={() => onToggle(item.profileImageId)} className="absolute right-0 top-0"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Content></Checkbox>}
      </div> : <div style={item.isCurated ? { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 } : undefined}>
        {item.isCurated && <figure style={{ minWidth: 0, margin: 0 }}>
          <figcaption style={{ marginBottom: 4, fontSize: 12, fontWeight: 700, color: '#374151' }}>원본</figcaption>
          <CurationOriginalPhoto item={item} onOpen={() => setViewerOpen(true)}></CurationOriginalPhoto>
        </figure>}
        <figure style={{ minWidth: 0, margin: 0 }}>
        {item.isCurated && <figcaption style={{ marginBottom: 4, fontSize: 12, fontWeight: 700, color: '#6d28d9' }}>✨큐레이팅 (지금 공개)</figcaption>}
        <div style={{ position: 'relative', aspectRatio: '3 / 4', backgroundColor: '#e5e7eb' }}>
        {imageFailed ? (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13, fontWeight: 700 }}>
            이미지 로드 실패
          </div>) : (<Button onPress={() => setViewerOpen(true)} aria-label={`${item.profileImageId} 크게 보기`} style={{ width: '100%', height: '100%', display: 'block' }}>
            <img src={src} alt={`${item.profileImageId} 프로필 이미지`} loading="lazy" onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
          </Button>)}
        <AuditStatusOverlay item={item}></AuditStatusOverlay>
        <Checkbox isSelected={selected} {...{ 'aria-label': `${item.profileImageId} 선택` }} style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: '50%' }} onChange={checked => onToggle(item.profileImageId)}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
        <Chip size="sm">{formatImageSlot(item)}</Chip>
      </div>
        </figure>
      </div>}
      <div style={{ padding: 12 }} className="p-4">
        <div>
          <p className="font-bold" title={item.userName || '이름 미등록'}>{item.userName || '이름 미등록'}</p><p className="text-sm text-gray-600" title={item.userId}>회원 ID: {item.userId}</p>
          <p title={item.universityName ?? '학교 미상'}>
            {item.universityName ?? '학교 미상'}
          </p>
          <p>
            {formatAgeGender(item)}
          </p>
          <Select aria-label="등급" value={item.profileRank ?? 'UNKNOWN'} isDisabled={rankUpdating} onChange={(key) => {
            const value = String(key ?? "");
            const rank = parseProfileRank(value);
            if (rank !== null)
                onRankChange(item, rank);
        }} className="min-w-[120px]"><Label>{"등급"}</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
            {PROFILE_RANK_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
                {option.label}
              </ListBox.Item>))}
          </ListBox></Select.Popover></Select>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Chip size="sm">{item.characterVersion === 'v1' ? '캐릭터 v1' : item.characterVersion === 'v2' ? '캐릭터 v2' : item.presentationMode === 'BLIND' ? '블라인드' : '일반 사진'}</Chip>
            <Chip size="sm">{formatProfileRank(item.profileRank)}</Chip>
            {item.kind !== 'blind_asset' && <Chip size="sm">{item.isCurated ? '✨큐레이팅 사진' : '큐레이팅 안 함'}</Chip>}
            <Chip size="sm">{formatImageKind(item)}</Chip>
            <Chip size="sm">{formatReviewedType(item.reviewedType)}</Chip>
            <Chip size="sm">{formatReviewStatus(item.reviewStatus)}</Chip>
            <Chip size="sm">{formatValidationSummary(item)}</Chip>
            <Chip size="sm">{formatAuditStatus(item.auditStatus)}</Chip>
            {item.hasReport && (<Chip size="sm">{"신고"}</Chip>)}
            {item.validation?.autoDecision === 'approved' && (<Chip size="sm">{"AI 통과"}</Chip>)}
            {item.isBlacklisted && <Chip size="sm">{"블랙리스트"}</Chip>}
            {item.suspendedAt && <Chip size="sm">{"정지"}</Chip>}
            <Chip size="sm">{`${item.approvedImageCount}/${item.totalActiveImageCount}장`}</Chip>
          </div>
          {item.selectable === false && <p className="text-xs text-gray-500">캐릭터 확인용입니다. 원본 사진 심사 작업에는 포함되지 않습니다.</p>}
          {item.kind === 'blind_asset' && item.selectable !== false && <p className="text-xs text-gray-500">캐릭터용으로 따로 올린 사진입니다. 변경 요청은 이 캐릭터만 내립니다.</p>}
          <Button aria-label="심사 상세 보기" onPress={() => setDetailOpen(true)} style={{ alignSelf: 'flex-start', border: '1px solid #cbd5e1', borderRadius: 1, paddingInline: 8, paddingBlock: 4, fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>
            상세
          </Button>
        </div>
      </div>
      <Modal.Backdrop isOpen={viewerOpen} onOpenChange={next => {
            if (!next)
                (() => setViewerOpen(false))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: item.presentationMode === 'BLIND' ? 920 : item.isCurated ? 1400 : 1200, minWidth: 0, backgroundColor: '#fff' }} aria-label="프로필 이미지 크게 보기">
        <Modal.Body style={{ padding: item.presentationMode === 'BLIND' ? 20 : 0, backgroundColor: item.presentationMode === 'BLIND' ? '#fff' : '#020617', position: 'relative' }}>
          <Button aria-label="큰 이미지 닫기" onPress={() => setViewerOpen(false)} variant="tertiary" isIconOnly={true} style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, color: '#fff', backgroundColor: 'rgba(15,23,42,0.72)' }}>
            <X></X>
          </Button>
          {item.presentationMode === 'BLIND' ? <BlindPhotoComparison item={item} /> : item.isCurated ? <div data-testid="audit-curation-viewer" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, padding: 16 }}>
            {[{ label: '원본 (큐레이팅 전)', url: item.curationOriginalImageUrl }, { label: '큐레이팅 (지금 공개)', url: src }].map(side => (<figure key={side.label} style={{ minWidth: 0, margin: 0 }}>
                <figcaption style={{ marginBottom: 6, fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{side.label}</figcaption>
                {side.url ? <img src={side.url} alt={`${item.profileImageId} ${side.label} 크게 보기`} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}/> : <div style={{ aspectRatio: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>원본 연결 없음</div>}
              </figure>))}
          </div> : <img src={src} alt={`${item.profileImageId} 프로필 이미지 크게 보기`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}/>}
        </Modal.Body>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
      <ProfileImageAuditDetailDrawer item={item} open={detailOpen} onClose={() => setDetailOpen(false)}></ProfileImageAuditDetailDrawer>
    </div>);
}
