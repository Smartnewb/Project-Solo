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
    // 캐릭터용 업로드 사진은 회원 프로필 사진이 아니라 정상 처리만 받는다.
    const photoOnlyDisabled = disabled || group.selectedItems.some((item) => item.kind === 'blind_asset');
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
        <Button isDisabled={photoOnlyDisabled} onPress={() => onAction('second-review')} variant="secondary">{<Eye></Eye>}
          2차 검토
        </Button>
        <Button isDisabled={photoOnlyDisabled} onPress={() => onAction('reject')} variant="secondary">{<XCircle></XCircle>}
          사진 변경 요청
        </Button>
        <Button isDisabled={photoOnlyDisabled} onPress={() => onAction('delete')} variant="secondary">{<Trash2></Trash2>}
          즉시 삭제
        </Button>
        <Button isDisabled={blacklistDisabled} onPress={onBlacklist} variant="secondary">{<ShieldBan></ShieldBan>}
          블랙리스트
        </Button>
      </div>
      {photoOnlyDisabled && !disabled && <p className="text-xs text-gray-500">캐릭터용 업로드 사진이 선택되어 있어 정상 처리만 할 수 있습니다.</p>}
    </div>);
}
