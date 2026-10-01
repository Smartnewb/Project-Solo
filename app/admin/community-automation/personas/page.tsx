'use client';
import { Button, Spinner, Chip, Modal, Select, ListBox, Slider } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import type { GhostPersonaInfo, PersonaDiversityReport, CommunityTraits, ReactionSpeed, ActivityCurve, } from '@/app/services/admin/community-automation';
import { personas as personasApi } from '@/app/services/admin/community-automation';
export default function PersonasPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<GhostPersonaInfo[]>([]);
    const [diversity, setDiversity] = useState<PersonaDiversityReport | null>(null);
    const [traitTarget, setTraitTarget] = useState<string | null>(null);
    const [traitForm, setTraitForm] = useState<CommunityTraits>({});
    const [traitLoading, setTraitLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [list, div] = await Promise.all([
                personasApi.list(),
                personasApi.diversity(),
            ]);
            setItems(list);
            setDiversity(div);
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
    function openTraitDialog(persona: GhostPersonaInfo) {
        setTraitTarget(persona.id);
        setTraitForm({ ...persona.communityTraits });
    }
    async function handleTraitSave() {
        if (!traitTarget)
            return;
        setTraitLoading(true);
        try {
            await personasApi.setTraits(traitTarget, traitForm);
            setTraitTarget(null);
            await load();
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '트레이트 저장 실패');
        }
        finally {
            setTraitLoading(false);
        }
    }
    async function handleTraitDelete() {
        if (!deleteTarget)
            return;
        setDeleteLoading(true);
        try {
            await personasApi.deleteTraits(deleteTarget);
            setDeleteTarget(null);
            await load();
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '트레이트 삭제 실패');
        }
        finally {
            setDeleteLoading(false);
        }
    }
    return (<div>
			{error && <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>{error}</aside>}

			{loading ? (<div style={{ display: "flex", paddingBlock: 48 }}>
					<Spinner size="sm"></Spinner>
				</div>) : (<>
					{diversity && (<>
							<h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>다양성 리포트</h2>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2" style={{ marginBottom: 24 }}>
								<div className="min-w-0">
									<div className="rounded-xl border p-4">
										<div className="p-4">
											<p>활성 Ghost</p>
											<p>{diversity.totalActiveGhosts}</p>
										</div>
									</div>
								</div>
								<div className="min-w-0">
									<div className="rounded-xl border p-4">
										<div className="p-4">
											<p>다양성 점수</p>
											<p>
												{diversity.diversityScore.toFixed(2)}
											</p>
										</div>
									</div>
								</div>
							</div>

							<p style={{ marginBottom: 8 }}>아키타입 분포</p>
							<div style={{ marginBottom: 24 }}>
								<table className="w-full text-sm">
									<thead className="bg-gray-50 text-left">
										<tr className="border-b">
											<th scope="col" className="border-b px-4 py-3">아키타입 코드</th>
											<th scope="col" className="border-b px-4 py-3">수량</th>
											<th scope="col" className="border-b px-4 py-3">비율 (%)</th>
										</tr>
									</thead>
									<tbody>
										{diversity.archetypeDistribution.map((row) => (<tr key={row.archetypeCode} className="border-b">
												<td className="border-b px-4 py-3">{row.archetypeCode}</td>
												<td className="border-b px-4 py-3">{row.count}</td>
												<td className="border-b px-4 py-3">{row.percentage.toFixed(1)}</td>
											</tr>))}
									</tbody>
								</table>
							</div>
							<hr style={{ marginBlock: 16 }}></hr>
						</>)}

					<h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>Ghost 페르소나 목록</h2>
					<div>
						<table className="w-full text-sm">
							<thead className="bg-gray-50 text-left">
								<tr className="border-b">
									<th scope="col" className="border-b px-4 py-3">아키타입</th>
									<th scope="col" className="border-b px-4 py-3">상태</th>
									<th scope="col" className="border-b px-4 py-3">반응 속도</th>
									<th scope="col" className="border-b px-4 py-3">노이즈 강도</th>
									<th scope="col" className="border-b px-4 py-3">활동 커브</th>
									<th scope="col" className="border-b px-4 py-3">트레이트</th>
								</tr>
							</thead>
							<tbody>
								{items.length === 0 ? (<tr className="border-b">
										<td colSpan={6} className="border-b px-4 py-3">활성 Ghost 없음</td>
									</tr>) : items.map((p) => (<tr key={p.id} className="border-b">
										<td className="border-b px-4 py-3">
											<p>{p.archetypeName}</p>
											<p>{p.archetypeCode}</p>
										</td>
										<td className="border-b px-4 py-3">
											<Chip size="sm">{p.status}</Chip>
										</td>
										<td className="border-b px-4 py-3">{p.communityTraits.reactionSpeed ?? '-'}</td>
										<td className="border-b px-4 py-3">{p.communityTraits.noiseStrength ?? '-'}</td>
										<td className="border-b px-4 py-3">{p.communityTraits.activityCurve ?? '-'}</td>
										<td className="border-b px-4 py-3">
											<div style={{ display: "flex", gap: 4 }}>
												<Button onPress={() => openTraitDialog(p)} variant="secondary">
													편집
												</Button>
												<Button onPress={() => setDeleteTarget(p.id)} variant="secondary">
													초기화
												</Button>
											</div>
										</td>
									</tr>))}
							</tbody>
						</table>
					</div>
				</>)}

			{/* Trait Edit Dialog */}
			<Modal.Backdrop isOpen={!!traitTarget} onOpenChange={next => {
            if (!next)
                (() => setTraitTarget(null))();
        }}><Modal.Container size="lg"><Modal.Dialog>
				<Modal.Heading>커뮤니티 트레이트 설정</Modal.Heading>
				<Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: '16px !important' }}>
					<div>
						<label>반응 속도</label>
						<Select value={traitForm.reactionSpeed ?? ''} aria-label={"반응 속도"} onChange={(key) => {
            const value = String(key ?? "");
            setTraitForm((f) => ({ ...f, reactionSpeed: (value as ReactionSpeed) || undefined }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} textValue={"\uBBF8\uC124\uC815"}>미설정</ListBox.Item>
							<ListBox.Item id={"high"} textValue={"\uBE60\uB984 (high)"}>빠름 (high)</ListBox.Item>
							<ListBox.Item id={"mid"} textValue={"\uBCF4\uD1B5 (mid)"}>보통 (mid)</ListBox.Item>
							<ListBox.Item id={"low"} textValue={"\uB290\uB9BC (low)"}>느림 (low)</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>

					<div>
						<p>
							노이즈 강도: {traitForm.noiseStrength ?? 0}
						</p>
						<Slider value={traitForm.noiseStrength ?? 0} aria-label="노이즈 강도" minValue={0} maxValue={1} step={0.05} onChange={value => setTraitForm((f) => ({ ...f, noiseStrength: Number(value) }))}><Slider.Track><Slider.Fill></Slider.Fill><Slider.Thumb></Slider.Thumb></Slider.Track></Slider>
					</div>

					<div>
						<label>활동 커브</label>
						<Select value={traitForm.activityCurve ?? ''} aria-label={"활동 커브"} onChange={(key) => {
            const value = String(key ?? "");
            setTraitForm((f) => ({ ...f, activityCurve: (value as ActivityCurve) || undefined }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} textValue={"\uBBF8\uC124\uC815"}>미설정</ListBox.Item>
							<ListBox.Item id={"morning"} textValue={"\uC544\uCE68 (morning)"}>아침 (morning)</ListBox.Item>
							<ListBox.Item id={"night"} textValue={"\uBC24 (night)"}>밤 (night)</ListBox.Item>
							<ListBox.Item id={"random"} textValue={"\uB79C\uB364 (random)"}>랜덤 (random)</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setTraitTarget(null)} variant="tertiary">취소</Button>
					<Button isDisabled={traitLoading} onPress={handleTraitSave} variant="primary">
						{traitLoading ? <Spinner size="sm"></Spinner> : '저장'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* Delete Confirm Dialog */}
			<Modal.Backdrop isOpen={!!deleteTarget} onOpenChange={next => {
            if (!next)
                (() => setDeleteTarget(null))();
        }}><Modal.Container size="lg"><Modal.Dialog>
				<Modal.Heading>트레이트 오버라이드 삭제</Modal.Heading>
				<Modal.Body>
					<p>이 Ghost의 커뮤니티 트레이트 오버라이드를 삭제하시겠습니까?</p>
					<p>재시작 시 초기화되는 설정입니다.</p>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setDeleteTarget(null)} variant="tertiary">취소</Button>
					<Button isDisabled={deleteLoading} onPress={handleTraitDelete} variant="primary">
						{deleteLoading ? <Spinner size="sm"></Spinner> : '삭제'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>
		</div>);
}
