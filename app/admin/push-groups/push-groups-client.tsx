'use client';
import { Button, Spinner, Chip, TextField, Input } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { PushTargetGroup } from '@/app/services/admin';
import { GROUP_TYPE_LABEL, GROUP_TYPE_COLOR, COUNTRY_SCOPE_LABEL } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { safeToLocaleDateString } from '@/app/utils/formatters';
interface PreviewState {
    loading: boolean;
    total?: number;
}
export default function PushGroupsClient() {
    const router = useRouter();
    const toast = useToast();
    const confirm = useConfirm();
    const [groups, setGroups] = useState<PushTargetGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [previewByGroup, setPreviewByGroup] = useState<Record<string, PreviewState>>({});
    const loadGroups = async () => {
        setLoading(true);
        try {
            const data = await AdminService.pushGroups.list();
            setGroups(data);
        }
        catch (error) {
            toast.error('그룹 목록을 불러오지 못했습니다.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const filteredGroups = useMemo(() => {
        if (!search.trim())
            return groups;
        return groups.filter((group) => group.name.includes(search.trim()));
    }, [groups, search]);
    const handlePreview = async (id: string) => {
        setPreviewByGroup((prev) => ({ ...prev, [id]: { loading: true } }));
        try {
            const result = await AdminService.pushGroups.preview(id);
            setPreviewByGroup((prev) => ({ ...prev, [id]: { loading: false, total: result.total } }));
        }
        catch (error) {
            setPreviewByGroup((prev) => ({ ...prev, [id]: { loading: false } }));
            toast.error('대상자 수를 확인하지 못했습니다.');
        }
    };
    const handleDelete = async (group: PushTargetGroup) => {
        const ok = await confirm({
            title: '그룹 삭제',
            message: `'${group.name}' 그룹을 삭제하시겠습니까?`,
            confirmText: '삭제',
            cancelText: '취소',
        });
        if (!ok)
            return;
        try {
            await AdminService.pushGroups.remove(group.id);
            toast.success('그룹을 삭제했습니다.');
            loadGroups();
        }
        catch (error) {
            toast.error('그룹 삭제에 실패했습니다.');
        }
    };
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <h1 className="text-2xl font-bold">
          푸시 타겟 그룹
        </h1>
        <Button onPress={() => router.push('/admin/push-groups/new')} variant="primary">
          새 그룹 생성
        </Button>
      </div>

      <TextField className="mb-4"><Input placeholder="그룹명으로 검색" value={search} onChange={(e) => setSearch(e.target.value)}></Input></TextField>

      {loading ? (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 32 }}>
          <Spinner size="sm"></Spinner>
        </div>) : (<div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="border-b">
                <th scope="col" className="whitespace-nowrap border-b px-4 py-3">그룹명</th>
                <th scope="col" className="whitespace-nowrap border-b px-4 py-3">타입</th>
                <th scope="col" className="whitespace-nowrap border-b px-4 py-3">국가스코프</th>
                <th scope="col" className="whitespace-nowrap border-b px-4 py-3">대상자수</th>
                <th scope="col" className="whitespace-nowrap border-b px-4 py-3">생성일</th>
                <th scope="col" className="whitespace-nowrap border-b px-4 py-3">생성자</th>
                <th scope="col" className="whitespace-nowrap border-b px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 && (<tr className="border-b">
                  <td colSpan={7} className="border-b px-4 py-3">
                    <p>
                      조건에 맞는 그룹이 없습니다.
                    </p>
                  </td>
                </tr>)}
              {filteredGroups.map((group) => {
                const preview = previewByGroup[group.id];
                return (<tr key={group.id} className="border-b">
                    <td className="border-b px-4 py-3">{group.name}</td>
                    <td className="whitespace-nowrap border-b px-4 py-3">
                      <Chip size="sm">{GROUP_TYPE_LABEL[group.type]}</Chip>
                    </td>
                    <td className="whitespace-nowrap border-b px-4 py-3">{COUNTRY_SCOPE_LABEL[group.countryScope]}</td>
                    <td className="whitespace-nowrap border-b px-4 py-3">
                      {preview?.loading ? (<Spinner size="sm"></Spinner>) : preview?.total !== undefined ? (<p>{preview.total.toLocaleString()}명</p>) : (<Button onPress={() => handlePreview(group.id)} variant="tertiary">
                          확인
                        </Button>)}
                    </td>
                    <td className="whitespace-nowrap border-b px-4 py-3">{safeToLocaleDateString(group.createdAt)}</td>
                    <td className="max-w-[180px] truncate border-b px-4 py-3 font-mono text-xs" title={group.createdBy ?? undefined}>{group.createdBy ?? '-'}</td>
                    <td className="whitespace-nowrap border-b px-4 py-3">
                      <div>
                        <Button onPress={() => router.push(`/admin/push-groups/${group.id}`)} variant="secondary">
                          상세
                        </Button>
                        <Button onPress={() => router.push(`/admin/push-groups/${group.id}/edit`)} variant="secondary">
                          수정
                        </Button>
                        <Button onPress={() => router.push(`/admin/broadcast-push/new?groupId=${group.id}`)} variant="secondary">
                          발송
                        </Button>
                        <Button onPress={() => handleDelete(group)} variant="secondary">
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>);
            })}
            </tbody>
          </table>
        </div>)}
    </div>);
}
