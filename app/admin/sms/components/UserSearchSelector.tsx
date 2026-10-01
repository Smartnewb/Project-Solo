'use client';
import { Button, Spinner, Chip, TextField, Label, Input, Checkbox } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useUserSearch } from '../hooks/useUserSearch';
import type { UserSearchItem } from '@/app/services/sms';
interface Props {
    selectedUserIds: string[];
    onSelectionChange: (next: string[]) => void;
    disabled?: boolean;
}
export function UserSearchSelector({ selectedUserIds, onSelectionChange, disabled }: Props) {
    const [query, setQuery] = useState('');
    const { data, isLoading, isError } = useUserSearch(query);
    // 칩 라벨용 캐시는 선택된 ID 집합에만 묶여 있어 무한 증가하지 않는다.
    const [labels, setLabels] = useState<Map<string, UserSearchItem>>(new Map());
    const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
    const select = (item: UserSearchItem) => {
        onSelectionChange([...selectedUserIds, item.id]);
        setLabels((prev) => new Map(prev).set(item.id, item));
    };
    const unselect = (id: string) => {
        onSelectionChange(selectedUserIds.filter((x) => x !== id));
        setLabels((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    };
    const toggle = (item: UserSearchItem) => {
        if (selectedSet.has(item.id))
            unselect(item.id);
        else
            select(item);
    };
    const trimmed = query.trim();
    const viewState: 'helper' | 'loading' | 'error' | 'empty' | 'list' = trimmed.length < 2
        ? 'helper'
        : isLoading
            ? 'loading'
            : isError
                ? 'error'
                : !data || data.data.length === 0
                    ? 'empty'
                    : 'list';
    function renderResults() {
        if (viewState === 'helper') {
            return (<p>
          이름 또는 휴대폰 2자 이상 입력하세요
        </p>);
        }
        if (viewState === 'loading') {
            return (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 16 }}>
          <Spinner size="sm"></Spinner>
        </div>);
        }
        if (viewState === 'error') {
            return (<p>
          검색 중 오류가 발생했습니다
        </p>);
        }
        if (viewState === 'empty') {
            return (<p>
          검색 결과 없음
        </p>);
        }
        return (<table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr className="border-b">
            <th scope="col" className="border-b px-4 py-3">선택</th>
            <th scope="col" className="border-b px-4 py-3">이름</th>
            <th scope="col" className="border-b px-4 py-3">휴대폰</th>
            <th scope="col" className="border-b px-4 py-3">성별</th>
          </tr>
        </thead>
        <tbody>
          {data!.data.map((item) => (<tr key={item.id} className="border-b">
              <td className="border-b px-4 py-3">
                <Checkbox isSelected={selectedSet.has(item.id)} isDisabled={disabled} onChange={checked => toggle(item)}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
              </td>
              <td className="border-b px-4 py-3">{item.name ?? '-'}</td>
              <td className="border-b px-4 py-3">{item.phoneNumber ?? '-'}</td>
              <td className="border-b px-4 py-3">{item.gender ?? '-'}</td>
            </tr>))}
        </tbody>
      </table>);
    }
    return (<div>
      <TextField className="mb-4"><Label>{"이름 또는 휴대폰 검색"}</Label><Input value={query} onChange={(e) => setQuery(e.target.value)} disabled={disabled}></Input></TextField>

      {selectedUserIds.length > 0 && (<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selectedUserIds.map((id) => {
                const cached = labels.get(id);
                return (<Chip key={id} size="sm">{cached?.name ?? cached?.phoneNumber ?? id}<Button isIconOnly={true} variant="tertiary" aria-label="선택 해제" onPress={disabled ? undefined : () => unselect(id)}>×</Button></Chip>);
            })}
        </div>)}

      {renderResults()}
    </div>);
}
