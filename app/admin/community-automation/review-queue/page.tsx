'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, TextArea, Select, ListBox, Checkbox } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import type { Content, ContentStatus } from '@/app/services/admin/community-automation';
import { reviewQueue as reviewApi } from '@/app/services/admin/community-automation';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
const STATUS_COLOR: Record<ContentStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
    draft: 'default',
    pending_review: 'warning',
    approved: 'info',
    scheduled: 'info',
    published: 'success',
    rejected: 'error',
    quality_failed: 'error',
    withdrawn: 'default',
};
const STATUS_LABEL: Record<ContentStatus, string> = {
    draft: '초안',
    pending_review: '검수 대기',
    approved: '승인',
    scheduled: '예약됨',
    published: '발화됨',
    rejected: '거절됨',
    quality_failed: '품질 실패',
    withdrawn: '회수됨',
};
type DialogMode = 'reject' | 'inject' | 'withdraw' | 'regenerate' | null;
const BULK_ACTION_LABEL = { approve: '승인', reject: '거절', withdraw: '회수' } as const;
export default function ReviewQueuePage() {
    const confirm = useConfirm();
    const toast = useToast();
    // 에러는 페이지 배너와 함께 토스트로도 알린다 (모달에 가려져 보이지 않기 때문).
    function fail(e: unknown, fallback: string) {
        const message = e instanceof Error ? e.message : fallback;
        setError(message);
        toast.error(message);
    }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Content[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'withdraw'>('approve');
    const [bulkLoading, setBulkLoading] = useState(false);
    const [dialogMode, setDialogMode] = useState<DialogMode>(null);
    const [dialogTarget, setDialogTarget] = useState<string | null>(null);
    const [dialogText, setDialogText] = useState('');
    const [dialogLoading, setDialogLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await reviewApi.list();
            setItems(data);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '불러오기 실패');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    function openDialog(mode: DialogMode, id: string, prefill = '') {
        setDialogMode(mode);
        setDialogTarget(id);
        setDialogText(prefill);
    }
    function closeDialog() {
        setDialogMode(null);
        setDialogTarget(null);
        setDialogText('');
    }
    async function handleDialogConfirm() {
        if (!dialogTarget || !dialogMode)
            return;
        setDialogLoading(true);
        try {
            if (dialogMode === 'reject')
                await reviewApi.reject(dialogTarget, dialogText);
            else if (dialogMode === 'inject')
                await reviewApi.inject(dialogTarget, dialogText);
            else if (dialogMode === 'withdraw')
                await reviewApi.withdraw(dialogTarget, dialogText);
            else if (dialogMode === 'regenerate')
                await reviewApi.regenerate(dialogTarget);
            closeDialog();
            await load();
        }
        catch (e: unknown) {
            fail(e, '처리 실패');
        }
        finally {
            setDialogLoading(false);
        }
    }
    async function handleApprove(id: string) {
        setActionLoading(id);
        try {
            await reviewApi.approve(id);
            await load();
        }
        catch (e: unknown) {
            fail(e, '승인 실패');
        }
        finally {
            setActionLoading(null);
        }
    }
    async function handleBulk() {
        if (selected.size === 0)
            return;
        const ok = await confirm({
            title: `일괄 ${BULK_ACTION_LABEL[bulkAction]}`,
            message: `선택한 콘텐츠 ${selected.size}개를 일괄 ${BULK_ACTION_LABEL[bulkAction]}합니다.`,
            confirmText: BULK_ACTION_LABEL[bulkAction],
            severity: bulkAction === 'approve' ? 'warning' : 'error',
        });
        if (!ok)
            return;
        setBulkLoading(true);
        try {
            const result = await reviewApi.bulk({
                contentIds: Array.from(selected),
                action: bulkAction,
            });
            const msg = `완료: ${result.succeeded.length}개, 실패: ${result.failed.length}개`;
            if (result.failed.length > 0)
                toast.warning(msg);
            else
                toast.success(msg);
            setSelected(new Set());
            await load();
        }
        catch (e: unknown) {
            fail(e, '일괄 처리 실패');
        }
        finally {
            setBulkLoading(false);
        }
    }
    function toggleSelect(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            }
            else {
                next.add(id);
            }
            return next;
        });
    }
    function toggleSelectAll() {
        if (selected.size === items.length) {
            setSelected(new Set());
        }
        else {
            setSelected(new Set(items.map((i) => i.id)));
        }
    }
    const dialogTitle: Record<NonNullable<DialogMode>, string> = {
        reject: '거절 사유',
        inject: '텍스트 수정 후 승인',
        withdraw: '회수 사유',
        regenerate: '재생성 확인',
    };
    return (<div>
			{error && <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>{error}</aside>}

			{selected.size > 0 && (<section style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }} className="rounded-xl border bg-white p-4">
					<p>{selected.size}개 선택됨</p>
					<div style={{ minWidth: 120 }}>
						<label>일괄 액션</label>
						<Select value={bulkAction} aria-label={"일괄 액션"} onChange={(key) => {
                const value = String(key ?? "");
                setBulkAction(value as typeof bulkAction);
            }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={"approve"} textValue={"\uC77C\uAD04 \uC2B9\uC778"}>일괄 승인</ListBox.Item>
							<ListBox.Item id={"reject"} textValue={"\uC77C\uAD04 \uAC70\uC808"}>일괄 거절</ListBox.Item>
							<ListBox.Item id={"withdraw"} textValue={"\uC77C\uAD04 \uD68C\uC218"}>일괄 회수</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>
					<Button isDisabled={bulkLoading} onPress={handleBulk} variant="primary">
						{bulkLoading ? <Spinner size="sm"></Spinner> : '실행'}
					</Button>
					<Button onPress={() => setSelected(new Set())} variant="tertiary">선택 해제</Button>
				</section>)}

			{loading ? (<div style={{ display: "flex", paddingBlock: 48 }}>
					<Spinner size="sm"></Spinner>
				</div>) : (<div>
					<table className="w-full text-sm">
						<thead className="bg-gray-50 text-left">
							<tr className="border-b">
								<th scope="col" className="border-b px-4 py-3">
									<Checkbox aria-label="검수 대기 콘텐츠 전체 선택" isSelected={items.length > 0 && selected.size === items.length} isIndeterminate={selected.size > 0 && selected.size < items.length} onChange={checked => toggleSelectAll()}><Checkbox.Content aria-label="검수 대기 콘텐츠 전체 선택"><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
								</th>
								<th scope="col" className="border-b px-4 py-3">내용 미리보기</th>
								<th scope="col" className="border-b px-4 py-3">타입</th>
								<th scope="col" className="border-b px-4 py-3">상태</th>
								<th scope="col" className="border-b px-4 py-3">품질 점수</th>
								<th scope="col" className="border-b px-4 py-3">생성일</th>
								<th scope="col" className="border-b px-4 py-3">액션</th>
							</tr>
						</thead>
						<tbody>
							{items.length === 0 ? (<tr className="border-b">
									<td colSpan={7} className="border-b px-4 py-3">검수 대기 콘텐츠 없음</td>
								</tr>) : items.map((item) => (<tr key={item.id} className="border-b">
									<td className="border-b px-4 py-3">
										<Checkbox aria-label={`${item.id} 선택`} isSelected={selected.has(item.id)} onChange={checked => toggleSelect(item.id)}><Checkbox.Content aria-label={`${item.id} 선택`}><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
									</td>
									<td style={{ maxWidth: 240 }} className="border-b px-4 py-3">
										<span title={item.finalText ?? item.generatedText ?? ''}>
											<p>
												{(item.finalText ?? item.generatedText ?? '-').slice(0, 60)}
											</p>
										</span>
									</td>
									<td className="border-b px-4 py-3">{item.targetType ?? '-'}</td>
									<td className="border-b px-4 py-3">
										<Chip size="sm">{STATUS_LABEL[item.status]}</Chip>
									</td>
									<td className="border-b px-4 py-3">
										{item.qualityScores
                    ? Object.entries(item.qualityScores)
                        .filter(([, v]) => v !== undefined)
                        .slice(0, 2)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(' | ')
                    : '-'}
									</td>
									<td className="border-b px-4 py-3">
										{new Date(item.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
									</td>
									<td className="border-b px-4 py-3">
										<div style={{ display: "flex", gap: 4 }}>
											<Button isDisabled={actionLoading === item.id} onPress={() => handleApprove(item.id)} variant="primary">
												승인
											</Button>
											<Button onPress={() => openDialog('inject', item.id, item.finalText ?? item.generatedText ?? '')} variant="secondary">
												수정승인
											</Button>
											<Button onPress={() => openDialog('reject', item.id)} variant="secondary">
												거절
											</Button>
											<Button onPress={() => openDialog('regenerate', item.id)} variant="secondary">
												재생성
											</Button>
											<Button onPress={() => openDialog('withdraw', item.id)} variant="secondary">
												회수
											</Button>
										</div>
									</td>
								</tr>))}
						</tbody>
					</table>
				</div>)}

			<Modal.Backdrop isOpen={!!dialogMode} isDismissable={!dialogLoading} isKeyboardDismissDisabled={dialogLoading} onOpenChange={next => {
            if (!next && !dialogLoading)
                closeDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
				<Modal.Heading>{dialogMode ? dialogTitle[dialogMode] : ''}</Modal.Heading>
				<Modal.Body style={{ paddingTop: '16px' }}>
					{dialogMode === 'regenerate' ? (<p>이 콘텐츠를 회수하고 새 DAG run을 시작하시겠습니까?</p>) : (<TextField className="mb-4"><Label>{dialogMode === 'inject' ? '최종 텍스트' : '사유'}</Label><TextArea rows={dialogMode === 'inject' ? 6 : 3} value={dialogText} onChange={(e) => setDialogText(e.target.value)}></TextArea></TextField>)}
				</Modal.Body>
				<Modal.Footer>
					<Button isDisabled={dialogLoading} onPress={closeDialog} variant="tertiary">취소</Button>
					<Button isDisabled={dialogLoading || (dialogMode !== 'regenerate' && !dialogText.trim())} onPress={handleDialogConfirm} variant={dialogMode === 'reject' || dialogMode === 'withdraw' ? 'danger' : 'primary'}>
						{dialogLoading ? <Spinner size="sm"></Spinner> : '확인'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>
		</div>);
}
