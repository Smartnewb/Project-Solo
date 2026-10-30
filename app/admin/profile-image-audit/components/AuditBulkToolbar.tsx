'use client';
import { Button } from '@heroui/react';
import { CheckCircle2, CheckSquare, Eye, ShieldBan, Trash2, XCircle, } from 'lucide-react';
import type { AuditAction, SelectedAuditGroup } from '../types';
type Props = {
    readonly group: SelectedAuditGroup;
    readonly visibleCount: number;
    readonly busy: boolean;
    readonly onSelectVisible: () => void;
    readonly onAction: (action: AuditAction) => void;
    readonly onBlacklist: () => void;
};
export function AuditBulkToolbar({ group, visibleCount, busy, onSelectVisible, onAction, onBlacklist, }: Props) {
    const disabled = group.selectedIds.length === 0 || busy;
    const selectVisibleDisabled = visibleCount === 0 || busy;
    const blacklistDisabled = disabled || group.selectedUserIds.length !== 1;
    const hasCharacterCard = group.selectedItems.some((item) => item.kind === 'blind_asset');
    const hasProfilePhoto = group.selectedItems.some((item) => item.kind !== 'blind_asset');
    const characterOnly = hasCharacterCard && !hasProfilePhoto;
    const mixedSelection = hasCharacterCard && hasProfilePhoto;
    // 거절된 사진은 서버가 '정상 처리(되돌리기)'만 받는다. 다른 버튼은 눌러도 '이미 처리됨'으로 실패한다.
    const hasRejected = group.selectedItems.some((item) => item.auditStatus === 'rejected');
    const characterActionLocked = disabled || hasCharacterCard || hasRejected;
    const rejectDisabled = disabled || mixedSelection || hasRejected;
    return (<div style={{ border: '1px solid #dbe3ef', borderRadius: 2, padding: 12, backgroundColor: '#f8fafc' }}>
      <p>
        선택 {group.selectedIds.length.toLocaleString()}장
        {group.selectedUserIds.length > 1 ? ` · ${group.selectedUserIds.length}명` : ''}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button isDisabled={selectVisibleDisabled} onPress={onSelectVisible} variant="secondary">{<CheckSquare></CheckSquare>}
          전체선택
        </Button>
        <Button isDisabled={disabled} onPress={() => onAction('mark-ok')} variant="primary">{<CheckCircle2></CheckCircle2>}
          정상 처리
        </Button>
        <Button isDisabled={characterActionLocked} onPress={() => onAction('second-review')} variant="secondary">{<Eye></Eye>}
          2차 검토
        </Button>
        <Button isDisabled={rejectDisabled} onPress={() => onAction('reject')} variant="secondary">{<XCircle></XCircle>}
          사진 변경 요청
        </Button>
        <Button isDisabled={characterActionLocked} onPress={() => onAction('delete')} variant="secondary">{<Trash2></Trash2>}
          즉시 삭제
        </Button>
        <Button isDisabled={blacklistDisabled} onPress={onBlacklist} variant="secondary">{<ShieldBan></ShieldBan>}
          블랙리스트
        </Button>
      </div>
      {mixedSelection && <p className="text-xs text-gray-500">프로필 사진과 캐릭터 카드를 함께 고르면 변경 요청을 할 수 없습니다. 2차 검토와 즉시 삭제는 할 수 없습니다.</p>}
      {hasRejected && <p className="text-xs text-gray-500">거절된 사진이 선택되어 있습니다. 거절된 사진은 &apos;정상 처리&apos;로 되돌리기만 할 수 있습니다.</p>}
      {characterOnly && <p className="text-xs text-gray-500">이 선택은 고른 캐릭터만 내립니다. 프로필 사진은 반려되지 않습니다. 2차 검토와 즉시 삭제는 할 수 없습니다.</p>}
    </div>);
}
