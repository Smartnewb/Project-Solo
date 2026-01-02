import { CurrentProfileImage, PendingImage } from '../page';

export interface SlotImagePair {
  current: CurrentProfileImage | null;
  pending: PendingImage | null;
}

export function mapImagesBySlot(
  profileUsing: CurrentProfileImage[] = [],
  pendingImages: PendingImage[] = []
): Map<number, SlotImagePair> {
  const slotMap = new Map<number, SlotImagePair>();

  profileUsing.forEach(img => {
    slotMap.set(img.slotIndex, {
      current: img,
      pending: null
    });
  });

  pendingImages.forEach(img => {
    const existing = slotMap.get(img.slotIndex);
    if (existing) {
      existing.pending = img;
    } else {
      slotMap.set(img.slotIndex, {
        current: null,
        pending: img
      });
    }
  });

  return slotMap;
}

export function getSlotLabel(slotIndex: number): string {
  switch (slotIndex) {
    case 0:
      return '대표사진';
    case 1:
      return '서브사진 1';
    case 2:
      return '서브사진 2';
    default:
      return `사진 ${slotIndex + 1}`;
  }
}

export function formatApprovedDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
