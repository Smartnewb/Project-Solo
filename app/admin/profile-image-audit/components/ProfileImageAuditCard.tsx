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
        <BlindPhotoComparison item={item} />
        <Button onPress={() => setViewerOpen(true)} variant="tertiary" size="sm" className="mt-2 w-full" aria-label={`${item.profileImageId} 크게 보기`}>나란히 크게 보기</Button>
        {item.selectable !== false && <Checkbox aria-label={`${item.profileImageId} 선택`} isSelected={selected} onChange={() => onToggle(item.profileImageId)} className="absolute right-0 top-0"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Content></Checkbox>}
      </div> : <div style={{ position: 'relative', aspectRatio: '3 / 4', backgroundColor: '#e5e7eb' }}>
        {imageFailed ? (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13, fontWeight: 700 }}>
            이미지 로드 실패
          </div>) : (<Button onPress={() => setViewerOpen(true)} aria-label={`${item.profileImageId} 크게 보기`} style={{ width: '100%', height: '100%', display: 'block' }}>
            <img src={src} alt={`${item.profileImageId} 프로필 이미지`} loading="lazy" onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
          </Button>)}
        <Checkbox isSelected={selected} {...{ 'aria-label': `${item.profileImageId} 선택` }} style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: '50%' }} onChange={checked => onToggle(item.profileImageId)}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
        <Chip size="sm">{formatImageSlot(item)}</Chip>
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
          <Button aria-label="심사 상세 보기" onPress={() => setDetailOpen(true)} style={{ alignSelf: 'flex-start', border: '1px solid #cbd5e1', borderRadius: 1, paddingInline: 8, paddingBlock: 4, fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>
            상세
          </Button>
        </div>
      </div>
      <Modal.Backdrop isOpen={viewerOpen} onOpenChange={next => {
            if (!next)
                (() => setViewerOpen(false))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: item.presentationMode === 'BLIND' ? 920 : 1200, minWidth: 0, backgroundColor: '#fff' }} aria-label="프로필 이미지 크게 보기">
        <Modal.Body style={{ padding: item.presentationMode === 'BLIND' ? 20 : 0, backgroundColor: item.presentationMode === 'BLIND' ? '#fff' : '#020617', position: 'relative' }}>
          <Button aria-label="큰 이미지 닫기" onPress={() => setViewerOpen(false)} variant="tertiary" isIconOnly={true} style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, color: '#fff', backgroundColor: 'rgba(15,23,42,0.72)' }}>
            <X></X>
          </Button>
          {item.presentationMode === 'BLIND' ? <BlindPhotoComparison item={item} /> : <img src={src} alt={`${item.profileImageId} 프로필 이미지 크게 보기`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}/>}
        </Modal.Body>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
      <ProfileImageAuditDetailDrawer item={item} open={detailOpen} onClose={() => setDetailOpen(false)}></ProfileImageAuditDetailDrawer>
    </div>);
}
