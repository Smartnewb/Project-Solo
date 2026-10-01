'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, Input, Select, ListBox } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Campaign, CampaignStatus, CommunityAutomationCategory, CommunityAutomationCategoryOption, CreateCampaignBody, DagTemplateId, } from '@/app/services/admin/community-automation';
import { campaigns as campaignsApi, COMMUNITY_AUTOMATION_CATEGORY_OPTIONS, getCommunityAutomationCategoryLabel, } from '@/app/services/admin/community-automation';
const STATUS_COLOR: Record<CampaignStatus, 'default' | 'success' | 'warning' | 'error'> = {
    draft: 'default',
    active: 'success',
    paused: 'warning',
    archived: 'error',
};
const STATUS_LABEL: Record<CampaignStatus, string> = {
    draft: '초안',
    active: '활성',
    paused: '일시정지',
    archived: '보관',
};
const DAG_TEMPLATE_OPTIONS: Array<{
    value: DagTemplateId;
    label: string;
    helper: string;
}> = [
    { value: 'post', label: '게시글 생성', helper: '새 커뮤니티 게시글을 생성합니다.' },
    { value: 'auto_comment', label: '댓글 생성', helper: '자동화가 만든 게시글에 댓글을 생성합니다.' },
    { value: 'target_comment', label: '특정 글 댓글', helper: '대상 게시글에 댓글을 생성합니다.' },
    { value: 'reply', label: '대댓글 생성', helper: '대상 댓글에 답글을 생성합니다.' },
];
type CreateCampaignForm = Omit<CreateCampaignBody, 'category'> & {
    category: CommunityAutomationCategory | '';
};
function formatDisplayDate(iso: string | null) {
    if (!iso)
        return '-';
    return new Date(iso).toLocaleDateString('ko-KR');
}
function parseDateInput(value?: string) {
    if (!value)
        return null;
    const date = parseISO(value);
    return isValid(date) ? date : null;
}
function toDateInput(value: Date | null) {
    return value ? format(value, 'yyyy-MM-dd') : undefined;
}
function getDagTemplateLabel(template: string | null | undefined) {
    if (!template)
        return '게시글 생성';
    return DAG_TEMPLATE_OPTIONS.find((option) => option.value === template)?.label ?? template;
}
export default function CampaignsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [items, setItems] = useState<Campaign[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<CommunityAutomationCategoryOption[]>(COMMUNITY_AUTOMATION_CATEGORY_OPTIONS);
    const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateCampaignForm>({ name: '', category: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [dagOpen, setDagOpen] = useState<string | null>(null);
    const [dagCount, setDagCount] = useState(1);
    const [dagTemplate, setDagTemplate] = useState<DagTemplateId | ''>('');
    const [dagLoading, setDagLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [data, categories] = await Promise.all([
                campaignsApi.list(statusFilter ? { status: statusFilter } : undefined),
                campaignsApi.categoryOptions(),
            ]);
            setItems(data);
            setCategoryOptions(categories);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '불러오기 실패');
        }
        finally {
            setLoading(false);
        }
    }, [statusFilter]);
    useEffect(() => {
        load();
    }, [load]);
    async function handleCreate() {
        if (!createForm.name || !createForm.category)
            return;
        if (createForm.startAt && createForm.endAt && createForm.startAt > createForm.endAt) {
            setError('종료일은 시작일과 같거나 이후여야 합니다.');
            return;
        }
        setCreateLoading(true);
        setSuccess(null);
        try {
            await campaignsApi.create({ ...createForm, category: createForm.category });
            setCreateOpen(false);
            setCreateForm({ name: '', category: '' });
            await load();
            setSuccess('캠페인을 생성했습니다.');
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '생성 실패');
        }
        finally {
            setCreateLoading(false);
        }
    }
    async function handleStatusChange(id: string, action: 'activate' | 'pause' | 'archive') {
        setActionLoading(id + action);
        setSuccess(null);
        try {
            await campaignsApi[action](id);
            await load();
            setSuccess('캠페인 상태를 변경했습니다.');
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '상태 변경 실패');
        }
        finally {
            setActionLoading(null);
        }
    }
    async function handleDagRun() {
        if (!dagOpen)
            return;
        setDagLoading(true);
        setSuccess(null);
        try {
            const result = await campaignsApi.triggerDagRun(dagOpen, {
                count: dagCount,
                dagTemplateId: dagTemplate || undefined,
            });
            setSuccess(`자동화 작업 ${result.jobsEnqueued}개를 큐에 등록했습니다.`);
            setDagOpen(null);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '자동화 실행 실패');
        }
        finally {
            setDagLoading(false);
        }
    }
    function getNextActions(status: CampaignStatus): Array<'activate' | 'pause' | 'archive'> {
        if (status === 'draft')
            return ['activate', 'archive'];
        if (status === 'active')
            return ['pause', 'archive'];
        if (status === 'paused')
            return ['activate', 'archive'];
        return [];
    }
    return (<div>
			<div style={{ display: "flex", marginBottom: 16 }}>
				<div style={{ display: "flex", gap: 16 }}>
					<div style={{ minWidth: 140 }}>
						<label>상태 필터</label>
						<Select value={statusFilter} aria-label={"상태 필터"} onChange={(key) => {
            const value = String(key ?? "");
            setStatusFilter(value as CampaignStatus | '');
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
							{(Object.keys(STATUS_LABEL) as CampaignStatus[]).map((s) => (<ListBox.Item key={s} id={s} textValue={String(STATUS_LABEL[s])}>{STATUS_LABEL[s]}</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
					</div>
				</div>
				<Button onPress={() => setCreateOpen(true)} variant="primary">
					캠페인 생성
				</Button>
			</div>

			{error && <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>{error}</aside>}
			{success && <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>{success}</aside>}

			{loading ? (<div style={{ display: "flex", paddingBlock: 48 }}>
					<Spinner size="sm"></Spinner>
				</div>) : (<div>
					<table className="w-full text-sm">
						<thead className="bg-gray-50 text-left">
							<tr className="border-b">
								<th scope="col" className="border-b px-4 py-3">이름</th>
								<th scope="col" className="border-b px-4 py-3">카테고리</th>
								<th scope="col" className="border-b px-4 py-3">상태</th>
								<th scope="col" className="border-b px-4 py-3">자동화 유형</th>
								<th scope="col" className="border-b px-4 py-3">시작</th>
								<th scope="col" className="border-b px-4 py-3">종료</th>
								<th scope="col" className="border-b px-4 py-3">생성일</th>
								<th scope="col" className="border-b px-4 py-3">액션</th>
							</tr>
						</thead>
						<tbody>
							{items.length === 0 ? (<tr className="border-b">
									<td colSpan={8} className="border-b px-4 py-3">캠페인 없음</td>
								</tr>) : items.map((item) => (<tr key={item.id} className="border-b">
									<td className="border-b px-4 py-3">
										<p>{item.name}</p>
										<p>{item.id.slice(0, 8)}…</p>
									</td>
									<td className="border-b px-4 py-3">{getCommunityAutomationCategoryLabel(item.category, categoryOptions)}</td>
									<td className="border-b px-4 py-3">
										<Chip size="sm">{STATUS_LABEL[item.status]}</Chip>
									</td>
									<td className="border-b px-4 py-3">{getDagTemplateLabel(item.dagTemplateId)}</td>
									<td className="border-b px-4 py-3">{formatDisplayDate(item.startAt)}</td>
									<td className="border-b px-4 py-3">{formatDisplayDate(item.endAt)}</td>
									<td className="border-b px-4 py-3">{formatDisplayDate(item.createdAt)}</td>
									<td className="border-b px-4 py-3">
										<div style={{ display: "flex", gap: 4 }}>
											{getNextActions(item.status).map((action) => (<Button key={action} isDisabled={actionLoading === item.id + action} onPress={() => handleStatusChange(item.id, action)} variant="secondary">
													{action === 'activate' ? '활성화' : action === 'pause' ? '일시정지' : '보관'}
												</Button>))}
											{item.status !== 'archived' && (<Button onPress={() => setDagOpen(item.id)} variant="primary">
													자동화 실행
												</Button>)}
										</div>
									</td>
								</tr>))}
						</tbody>
					</table>
				</div>)}

			{/* Create Dialog */}
			<Modal.Backdrop isOpen={createOpen} onOpenChange={next => {
            if (!next)
                (() => setCreateOpen(false))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
				<Modal.Heading>캠페인 생성</Modal.Heading>
				<Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: '16px !important' }}>
					<TextField isRequired={true} className="mb-4"><Label>{"이름"}</Label><Input required value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}></Input></TextField>
					<div>
						<label>카테고리</label>
						<Select value={createForm.category} aria-label={"카테고리"} onChange={(key) => {
            const value = String(key ?? "");
            setCreateForm((f) => ({
                ...f,
                category: value as CommunityAutomationCategory,
            }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} isDisabled={true} textValue={"\uCE74\uD14C\uACE0\uB9AC \uC120\uD0DD"}>
								카테고리 선택
							</ListBox.Item>
							{categoryOptions.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
									{option.label}
								</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
						<p>운영 DB의 커뮤니티 카테고리 코드로 저장됩니다.</p>
					</div>
					<div>
						<label>자동화 유형</label>
						<Select value={createForm.dagTemplateId ?? ''} aria-label={"자동화 유형"} onChange={(key) => {
            const value = String(key ?? "");
            setCreateForm((f) => ({ ...f, dagTemplateId: (value as DagTemplateId) || undefined }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} textValue={"\uAE30\uBCF8\uAC12: \uAC8C\uC2DC\uAE00 \uC0DD\uC131"}>기본값: 게시글 생성</ListBox.Item>
							{DAG_TEMPLATE_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label) + (" " + "\u00B7") + (" " + String(option.helper))}>
									{option.label} · {option.helper}
								</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
						<p>생성할 커뮤니티 콘텐츠의 작업 유형입니다.</p>
					</div>
					<div>
						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
							<TextField className="min-w-[150px]"><Label>{"시작일"}</Label><Input type="date" value={createForm.startAt} onChange={event => setCreateForm(f => ({ ...f, startAt: event.target.value }))}></Input></TextField>
							<TextField className="min-w-[150px]"><Label>{"종료일"}</Label><Input type="date" value={createForm.endAt} onChange={event => setCreateForm(f => ({ ...f, endAt: event.target.value }))}></Input></TextField>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setCreateOpen(false)} variant="tertiary">취소</Button>
					<Button isDisabled={createLoading} onPress={handleCreate} variant="primary">
						{createLoading ? <Spinner size="sm"></Spinner> : '생성'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* Automation Run Dialog */}
			<Modal.Backdrop isOpen={!!dagOpen} onOpenChange={next => {
            if (!next)
                (() => setDagOpen(null))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
				<Modal.Heading>자동화 수동 실행</Modal.Heading>
				<Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: '16px !important' }}>
					<div>
						<label>자동화 유형</label>
						<Select value={dagTemplate} aria-label={"자동화 유형"} onChange={(key) => {
            const value = String(key ?? "");
            setDagTemplate(value as DagTemplateId | '');
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} textValue={"\uCEA0\uD398\uC778 \uAE30\uBCF8\uAC12"}>캠페인 기본값</ListBox.Item>
							{DAG_TEMPLATE_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
									{option.label}
								</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
						<p>DAG는 내부 실행 그래프 이름이라 화면에서는 자동화 유형으로 표시합니다.</p>
					</div>
					<TextField className="mb-4"><Label>{"실행 수 (1-10)"}</Label><Input type="number" value={dagCount} onChange={(e) => setDagCount(Math.max(1, Math.min(10, Number(e.target.value))))} {...{ min: 1, max: 10 }}></Input></TextField>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setDagOpen(null)} variant="tertiary">취소</Button>
					<Button isDisabled={dagLoading} onPress={handleDagRun} variant="primary">
						{dagLoading ? <Spinner size="sm"></Spinner> : '실행'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>
		</div>);
}
