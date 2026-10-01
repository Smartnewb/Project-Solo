import { Label, Button, Chip, Checkbox, Select, ListBox } from '@heroui/react';
import { X as CloseIcon } from 'lucide-react';
import { PendingUser } from "../page";
import { format } from "date-fns";
interface UserTableListProps {
    users: PendingUser[];
    selectedUser: PendingUser | null;
    onUserSelect: (user: PendingUser) => void;
    onSkipUser?: (userId: string) => void;
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
    onPageChange: (page: number) => void;
    searchTerm: string;
    selectedUserIds?: string[];
    onUserCheck?: (userId: string, checked: boolean) => void;
    onSelectAllCheck?: (checked: boolean) => void;
}
const getRankConfig = (rank?: string) => {
    const configs = {
        S: {
            label: "S",
            color: "#9c27b0",
            bgColor: "#f3e5f5",
            tooltip: "최상위 등급",
        },
        A: {
            label: "A",
            color: "#2196f3",
            bgColor: "#F3F0FC",
            tooltip: "상위 등급",
        },
        B: {
            label: "B",
            color: "#4caf50",
            bgColor: "#e8f5e9",
            tooltip: "중위 등급",
        },
        C: {
            label: "C",
            color: "#ff9800",
            bgColor: "#fff3e0",
            tooltip: "하위 등급",
        },
        UNKNOWN: {
            label: "-",
            color: "#9e9e9e",
            bgColor: "#f5f5f5",
            tooltip: "등급 미정",
        },
    };
    return configs[rank as keyof typeof configs] || configs.UNKNOWN;
};
const RankBadge = ({ rank }: {
    rank?: string;
}) => {
    const config = getRankConfig(rank);
    return (<span title={config.tooltip}>
      <Chip size="sm">{config.label}</Chip>
    </span>);
};
export default function UserTableList({ users, selectedUser, onUserSelect, onSkipUser, pagination, onPageChange, searchTerm, selectedUserIds = [], onUserCheck, onSelectAllCheck, }: UserTableListProps) {
    const isAllSelected = users.length > 0 && users.every(user => selectedUserIds.includes(user.userId));
    const isSomeSelected = selectedUserIds.length > 0 && !isAllSelected;
    if (users.length === 0 && !searchTerm) {
        return (<section style={{ padding: 32, textAlign: "center" }} className="rounded-xl border bg-white p-4">
        <p style={{ fontWeight: 700, color: "#111827" }}>
          심사 대기 중인 사용자가 없습니다.
        </p>
        <p style={{ marginTop: 8 }}>
          새 심사 대상이 들어오기 전까지 미승인 유저 또는 최근 심사 이력을 확인할 수 있습니다.
        </p>
        <div style={{ marginTop: 16 }}>
          <a href="/admin/unapproved-users" className="inline-flex items-center gap-2 rounded-lg border p-2">
            미승인 유저 보기
          </a>
          <a href="/admin/review-inbox" className="inline-flex items-center gap-2 rounded-lg border p-2">
            검토 인박스 보기
          </a>
        </div>
      </section>);
    }
    return (<div>
      {users.length === 0 && searchTerm ? (<div style={{ padding: 32, textAlign: "center" }}>
          <p>
            &apos;{searchTerm}&apos;에 대한 검색 결과가 없습니다.
          </p>
        </div>) : (<table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr style={{ backgroundColor: "#f5f5f5" }} className="border-b">
              {onUserCheck && (<th scope="col" className="border-b px-4 py-3">
                  <Checkbox aria-label="현재 페이지 전체 선택" isSelected={isAllSelected} isIndeterminate={isSomeSelected} onChange={checked => onSelectAllCheck?.(checked)}><Checkbox.Content aria-label="현재 페이지 전체 선택"><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
                </th>)}
              <th scope="col" className="border-b px-4 py-3">이름</th>
              <th scope="col" className="border-b px-4 py-3">나이/성별</th>
              <th scope="col" className="border-b px-4 py-3">Rank</th>
              <th scope="col" className="border-b px-4 py-3">대학교</th>
              <th scope="col" className="border-b px-4 py-3">사진</th>
              <th scope="col" className="border-b px-4 py-3">최초심사</th>
              <th scope="col" className="border-b px-4 py-3">등록일시</th>
              {onSkipUser && <th scope="col" style={{ width: 40 }} className="border-b px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
                const isChecked = selectedUserIds.includes(user.userId);
                return (<tr key={user.id} style={{ cursor: "pointer", backgroundColor: selectedUser?.id === user.id ? "#F3F0FC" : "inherit" }} className="border-b">
                  {onUserCheck && (<td onClick={(e) => e.stopPropagation()} className="border-b px-4 py-3">
                      <Checkbox aria-label={`${user.name} 선택`} isSelected={isChecked} onChange={checked => onUserCheck(user.userId, checked)}><Checkbox.Content aria-label={`${user.name} 선택`}><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
                    </td>)}
                  <td className="border-b px-4 py-3">
                    <Button variant="tertiary" aria-pressed={selectedUser?.id === user.id} onPress={() => onUserSelect(user)}>{user.name}</Button>
                  </td>
                  <td className="border-b px-4 py-3">
                    <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {user.age}세 ·{" "}
                      {user.gender === "MALE"
                        ? "남"
                        : user.gender === "FEMALE"
                            ? "여"
                            : "-"}
                    </p>
                  </td>
                  <td className="border-b px-4 py-3">
                    <RankBadge rank={user.rank}></RankBadge>
                  </td>
                  <td className="border-b px-4 py-3">
                    <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {user.universityName || "-"}
                    </p>
                  </td>
                  <td className="border-b px-4 py-3">
                    <Chip size="sm">{`${user.pendingImages?.length || 0}장`}</Chip>
                  </td>
                  <td className="border-b px-4 py-3">
                    <Chip size="sm">{user.approved ? "아니오" : "예"}</Chip>
                  </td>
                  <td className="border-b px-4 py-3">
                    <p style={{ fontSize: "0.75rem" }}>
                      {user.createdAt && !isNaN(new Date(user.createdAt).getTime())
                        ? format(new Date(user.createdAt), "MM-dd HH:mm")
                        : "-"}
                    </p>
                  </td>
                  {onSkipUser && (<td style={{ padding: 4 }} className="border-b px-4 py-3">
                      <span title={"건너뛰기"}>
                        <Button aria-label={`${user.name} 건너뛰기`} onClick={(e) => {
                            e.stopPropagation();
                            onSkipUser(user.userId);
                        }} variant="tertiary" isIconOnly={true} style={{ color: "#9e9e9e" }}>
                          <CloseIcon></CloseIcon>
                        </Button>
                      </span>
                    </td>)}
                </tr>);
            })}
          </tbody>
        </table>)}
      <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={pagination.limit} isDisabled={true} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={20} textValue={"20"}>20</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={pagination.page - 1 <= 0} onPress={() => ((_event, newPage) => onPageChange(newPage + 1))(null, pagination.page - 1 - 1)}>이전</Button><span>{pagination.page - 1 + 1} 페이지 / {pagination.total}개</span><Button variant="secondary" isDisabled={(pagination.page - 1 + 1) * pagination.limit >= pagination.total} onPress={() => ((_event, newPage) => onPageChange(newPage + 1))(null, pagination.page - 1 + 1)}>다음</Button></div>
    </div>);
}
