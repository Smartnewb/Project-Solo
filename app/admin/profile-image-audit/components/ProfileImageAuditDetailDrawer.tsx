'use client';
import { Button, Chip, Drawer } from '@heroui/react';
import { ExternalLink, X } from 'lucide-react';
import type { ProfileImageAuditItem } from '@/app/services/admin';
import { BlindPhotoComparison } from './BlindPhotoComparison';
import { formatAuditStatus, formatValidationDecision, formatValidationSummary, sortAuditSiblingImages, } from '../profile-image-audit-utils';
type Props = {
    readonly item: ProfileImageAuditItem;
    readonly open: boolean;
    readonly onClose: () => void;
};
type Metric = {
    readonly label: string;
    readonly value: string;
};
function formatDate(value: string | null | undefined): string {
    if (!value)
        return '-';
    return new Date(value).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
function countText(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString();
}
function getMetrics(item: ProfileImageAuditItem): readonly Metric[] {
    const context = item.reviewContext;
    return [
        { label: '가입일', value: formatDate(context?.userCreatedAt) },
        { label: '좋아요', value: countText(context?.receivedLikeCount) },
        { label: '매칭', value: countText(context?.matchCount) },
        { label: '채팅', value: countText(context?.chatRoomCount) },
    ];
}
export function ProfileImageAuditDetailDrawer({ item, open, onClose }: Props) {
    const context = item.reviewContext;
    const reportCount = context?.reportCount ?? item.riskSignals.reportCount;
    const hasSuspension = context?.hasSuspensionHistory ?? item.riskSignals.hasSuspensionHistory;
    const isFirstReview = context?.isFirstReview ?? item.riskSignals.isFirstReview;
    const isUniversityVerified = context?.isUniversityVerified ?? item.riskSignals.isUniversityVerified;
    const hasPurchased = context?.hasPurchased ?? item.riskSignals.hasPurchaseHistory;
    const rejectionHistory = item.rejectionHistory ?? [];
    const rejectedImages = item.rejectedImages ?? [];
    return (<Drawer.Backdrop isOpen={open} onOpenChange={v => !v && onClose()}><Drawer.Content placement="right" className="w-full"><Drawer.Dialog style={{ width: 'min(480px, 100vw)', maxWidth: '100%', height: '100%', minWidth: 0 }} className="overflow-y-auto">
      <div style={{ maxWidth: '100vw', padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <Drawer.Heading className="text-lg font-semibold">
            심사 상세
          </Drawer.Heading>
          <Button onPress={onClose} variant="tertiary">{<X></X>}
            닫기
          </Button>
        </div>

        {item.presentationMode === 'BLIND' && <div className="mb-4"><BlindPhotoComparison item={item} /></div>}
        <div>
          {(reportCount > 0 || hasSuspension) && (<div style={{ border: '1px solid #fecaca', backgroundColor: '#fef2f2', borderRadius: 1, padding: 12 }}>
              {reportCount > 0 && <p>신고 {reportCount}회</p>}
              {hasSuspension && <p>제재 이력 있음</p>}
            </div>)}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {isFirstReview && <Chip size="sm">{"첫 심사"}</Chip>}
            {isUniversityVerified && <Chip size="sm">{"학교 인증"}</Chip>}
            {hasPurchased && <Chip size="sm">{"구매 이력"}</Chip>}
            {item.isBlacklisted && <Chip size="sm">{"블랙리스트"}</Chip>}
            {item.suspendedAt && <Chip size="sm">{"정지 계정"}</Chip>}
          </div>

          <div>
            <p style={{ marginBottom: 8 }}>
              연관 사진
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sortAuditSiblingImages(item.siblingImages).map((image, index) => (<div key={image.profileImageId} style={{ width: 82 }}>
                  <img src={image.thumbnailUrl ?? image.imageUrl} alt={`연관 사진 ${index + 1}`} style={{ width: 82, height: 96, objectFit: 'cover', borderRadius: 1, border: image.profileImageId === item.profileImageId ? '2px solid #2563eb' : '1px solid #cbd5e1' }}/>
                  <p>
                    {image.isMain ? '대표' : `${image.slotIndex + 1}번`} · {image.reviewStatus}
                  </p>
                </div>))}
            </div>
          </div>

          <hr></hr>

          <div style={{ display: 'grid', gap: 8 }}>
            {getMetrics(item).map((metric) => (<div key={metric.label} style={{ border: '1px solid #e2e8f0', borderRadius: 1, padding: 8 }}>
                <p>{metric.label}</p>
                <p>{metric.value}</p>
              </div>))}
          </div>

          <div>
            <p>이전 거절 이력</p>
            {rejectionHistory.length === 0 ? (<p>없음</p>) : (rejectionHistory.map((history) => (<p key={`${history.createdAt}-${history.reason}`}>
                  {history.category} · {history.reason} · {formatDate(history.createdAt)}
                </p>)))}
          </div>

          <div>
            <p>거절된 이미지 이력</p>
            {rejectedImages.length === 0 ? (<p>없음</p>) : (<div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {rejectedImages.map((image, index) => (<div key={image.id} style={{ width: 76 }}>
                    <img src={image.imageUrl} alt={`거절된 이미지 ${index + 1}`} style={{ width: 76, height: 88, objectFit: 'cover', borderRadius: 1 }}/>
                    <p>
                      {image.rejectionReason}
                    </p>
                  </div>))}
              </div>)}
          </div>

          <div>
            <p>소개글</p>
            <p>
              {item.bio ?? '없음'}
            </p>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 1, padding: 12 }}>
            <p>검증 요약</p>
            {[
            { label: '검증 점수', value: String(item.validation?.totalScore ?? '-') },
            { label: '자동 판정', value: formatValidationDecision(item.validation?.autoDecision ?? null) },
            { label: '판정 사유', value: item.validation?.decisionReason ?? '-' },
            { label: '카드 표시', value: formatValidationSummary(item) },
            { label: '감사 상태', value: formatAuditStatus(item.auditStatus) },
        ].map((row) => (<div key={row.label}>
                <p>{row.label}</p>
                <p>{row.value}</p>
              </div>))}
          </div>

          <a href={`/admin/users/appearance?userId=${encodeURIComponent(item.userId)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
            사용자 상세에서 열기
            <ExternalLink></ExternalLink>
          </a>
        </div>
      </div>
    </Drawer.Dialog></Drawer.Content></Drawer.Backdrop>);
}
