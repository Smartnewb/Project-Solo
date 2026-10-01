'use client';
import { Button, Chip, Checkbox } from '@heroui/react';
import { Pencil as EditIcon, Trash2 as DeleteIcon, GripVertical as DragIndicatorIcon } from 'lucide-react';
import { forwardRef } from 'react';
import type { Banner } from '@/types/admin';
import { safeToLocaleDateString } from '@/app/utils/formatters';
type BannerStatus = 'active' | 'scheduled' | 'expired' | 'inactive';
function getBannerStatus(banner: Banner): BannerStatus {
    if (!banner.isActive)
        return 'inactive';
    const now = new Date();
    if (banner.endDate && now > new Date(banner.endDate))
        return 'expired';
    if (banner.startDate && now < new Date(banner.startDate))
        return 'scheduled';
    return 'active';
}
function getStatusLabel(status: BannerStatus): string {
    switch (status) {
        case 'active': return '게시 중';
        case 'scheduled': return '예약됨';
        case 'expired': return '만료됨';
        case 'inactive': return '비활성';
    }
}
function getStatusColor(status: BannerStatus): 'success' | 'info' | 'default' | 'error' {
    switch (status) {
        case 'active': return 'success';
        case 'scheduled': return 'info';
        case 'expired': return 'default';
        case 'inactive': return 'error';
    }
}
function formatDate(dateString: string | null): string {
    if (!dateString)
        return '무제한';
    return safeToLocaleDateString(dateString, 'ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function getPositionLabel(position: string): string {
    switch (position) {
        case 'home': return '홈';
        case 'moment': return '모먼트';
        default: return position;
    }
}
interface BannerCardProps {
    banner: Banner;
    onToggleActive: (id: string, isActive: boolean) => void;
    onEdit: (banner: Banner) => void;
    onDelete: (id: string) => void;
    isDragging?: boolean;
    dragHandleProps?: any;
}
const BannerCard = forwardRef<HTMLDivElement, BannerCardProps>(({ banner, onToggleActive, onEdit, onDelete, isDragging, dragHandleProps, ...props }, ref) => {
    const status = getBannerStatus(banner);
    return (<div ref={ref} {...props} style={{ display: 'flex', marginBottom: 16, opacity: isDragging ? 0.8 : 1, boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.1)', transition: 'box-shadow 0.2s ease' }} className="rounded-xl border p-4">
        <div {...dragHandleProps} style={{ display: 'flex', alignItems: 'center', paddingInline: 8, cursor: 'grab', backgroundColor: "#f3f4f6" }}>
          <DragIndicatorIcon></DragIndicatorIcon>
        </div>

        <img alt="배너 이미지" style={{ width: 200, height: 120, objectFit: 'cover' }} src={banner.imageUrl}/>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingBlock: 8 }} className="p-4">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Chip size="sm">{getPositionLabel(banner.position)}</Chip>
              <Chip size="sm">{getStatusLabel(status)}</Chip>
              {banner.actionType && (<Chip size="sm">{banner.actionType === 'internal' ? '앱 내 이동' : '외부 링크'}</Chip>)}
            </div>

            <p style={{ marginBottom: 4 }}>
              {banner.actionUrl || '액션 없음'}
            </p>

            <p>
              {banner.startDate || banner.endDate
            ? `${formatDate(banner.startDate)} ~ ${formatDate(banner.endDate)}`
            : '상시 게시'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Checkbox aria-label="배너 활성화" isSelected={banner.isActive} onChange={checked => onToggleActive(banner.id, checked)}><Checkbox.Content aria-label="배너 활성화"><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
            <Button aria-label="배너 수정" onPress={() => onEdit(banner)} variant="tertiary" isIconOnly={true}>
              <EditIcon></EditIcon>
            </Button>
            <Button aria-label="배너 삭제" onPress={() => onDelete(banner.id)} variant="tertiary" isIconOnly={true}>
              <DeleteIcon></DeleteIcon>
            </Button>
          </div>
        </div>
      </div>);
});
BannerCard.displayName = 'BannerCard';
export default BannerCard;
