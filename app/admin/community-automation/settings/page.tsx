'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, Input, Checkbox } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import type { CommunitySettings, KillSwitchStatus } from '@/app/services/admin/community-automation';
import { communitySettings as settingsApi } from '@/app/services/admin/community-automation';
export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [killSwitch, setKillSwitch] = useState<KillSwitchStatus | null>(null);
    const [settings, setSettings] = useState<CommunitySettings | null>(null);
    const [killActionLoading, setKillActionLoading] = useState(false);
    const [killConfirmOpen, setKillConfirmOpen] = useState(false);
    const [killConfirmAction, setKillConfirmAction] = useState<'kill' | 'restore'>('kill');
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [form, setForm] = useState<CommunitySettings>({
        dagRunEnabled: true,
        publishEnabled: true,
        activitySimulatorEnabled: true,
        maxDailyPublish: 50,
        reviewRequiredBeforePublish: true,
    });
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [ks, s] = await Promise.all([
                settingsApi.getKillSwitch(),
                settingsApi.get(),
            ]);
            setKillSwitch(ks);
            setSettings(s);
            setForm(s);
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
    async function handleKillConfirm() {
        setKillActionLoading(true);
        try {
            if (killConfirmAction === 'kill') {
                await settingsApi.kill();
            }
            else {
                await settingsApi.restore();
            }
            setKillConfirmOpen(false);
            await load();
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '킬 스위치 처리 실패');
        }
        finally {
            setKillActionLoading(false);
        }
    }
    async function handleSettingsSave() {
        setSettingsLoading(true);
        try {
            const updated = await settingsApi.update(form);
            setSettings(updated);
            setForm(updated);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '설정 저장 실패');
        }
        finally {
            setSettingsLoading(false);
        }
    }
    async function handleReset() {
        setResetLoading(true);
        try {
            const defaults = await settingsApi.reset();
            setSettings(defaults);
            setForm(defaults);
            setResetConfirmOpen(false);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '초기화 실패');
        }
        finally {
            setResetLoading(false);
        }
    }
    if (loading) {
        return (<div style={{ display: "flex", paddingBlock: 48 }}>
				<Spinner size="sm"></Spinner>
			</div>);
    }
    return (<div style={{ maxWidth: 600 }}>
			{error && <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>{error}</aside>}

			{/* Kill Switch */}
			<div className="rounded-xl border p-4" style={{ marginBottom: 24 }}>
				<div className="p-4">
					<div style={{ display: "flex", marginBottom: 8 }}>
						<h2 className="text-lg font-semibold">긴급 킬 스위치</h2>
						{killSwitch && (<Chip size="sm">{killSwitch.killed ? '중단됨' : '운영 중'}</Chip>)}
					</div>
					<p style={{ marginBottom: 16 }}>
						활성화 시 DAG 생성·발화·Activity Simulator 전체 즉시 차단됩니다.
					</p>
					<div style={{ display: "flex", gap: 16 }}>
						{killSwitch?.killed ? (<Button onPress={() => { setKillConfirmAction('restore'); setKillConfirmOpen(true); }} variant="primary">
								자동화 재개
							</Button>) : (<Button onPress={() => { setKillConfirmAction('kill'); setKillConfirmOpen(true); }} variant="primary">
								긴급 중단
							</Button>)}
					</div>
				</div>
			</div>

			<hr style={{ marginBlock: 24 }}></hr>

			{/* Settings Form */}
			<h2 className="text-lg font-semibold" style={{ marginBottom: 16 }}>자동화 설정</h2>

			<div style={{ display: "flex", gap: 16 }}>
				<Checkbox isSelected={form.dagRunEnabled} onChange={checked => setForm((f) => ({ ...f, dagRunEnabled: checked }))} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"DAG Run 활성화"}</Checkbox.Content></Checkbox>
				<Checkbox isSelected={form.publishEnabled} onChange={checked => setForm((f) => ({ ...f, publishEnabled: checked }))} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"발화(Publish) 활성화"}</Checkbox.Content></Checkbox>
				<Checkbox isSelected={form.activitySimulatorEnabled} onChange={checked => setForm((f) => ({ ...f, activitySimulatorEnabled: checked }))} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"Activity Simulator 활성화"}</Checkbox.Content></Checkbox>
				<Checkbox isSelected={form.reviewRequiredBeforePublish} onChange={checked => setForm((f) => ({ ...f, reviewRequiredBeforePublish: checked }))} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"발화 전 검수 필요"}</Checkbox.Content></Checkbox>
				<TextField className="mb-4"><Label>{"일일 최대 발화 수"}</Label><Input type="number" value={form.maxDailyPublish} onChange={(e) => setForm((f) => ({
            ...f,
            maxDailyPublish: Math.max(1, Math.min(500, Number(e.target.value))),
        }))} {...{ min: 1, max: 500 }}></Input></TextField>
			</div>

			<div style={{ display: "flex", gap: 16, marginTop: 24 }}>
				<Button isDisabled={settingsLoading} onPress={handleSettingsSave} variant="primary">
					{settingsLoading ? <Spinner size="sm"></Spinner> : '저장'}
				</Button>
				<Button onPress={() => setResetConfirmOpen(true)} variant="secondary">
					기본값으로 초기화
				</Button>
			</div>

			{/* Kill Confirm Dialog */}
			<Modal.Backdrop isOpen={killConfirmOpen} onOpenChange={next => {
            if (!next)
                (() => setKillConfirmOpen(false))();
        }}><Modal.Container size="lg"><Modal.Dialog>
				<Modal.Heading>
					{killConfirmAction === 'kill' ? '긴급 중단 확인' : '자동화 재개 확인'}
				</Modal.Heading>
				<Modal.Body>
					{killConfirmAction === 'kill' ? (<p>
							전체 커뮤니티 자동화를 즉시 중단합니다. DAG 생성, 발화, Activity Simulator가 모두 차단됩니다.
						</p>) : (<p>커뮤니티 자동화를 재개합니다.</p>)}
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setKillConfirmOpen(false)} variant="tertiary">취소</Button>
					<Button isDisabled={killActionLoading} onPress={handleKillConfirm} variant="primary">
						{killActionLoading ? <Spinner size="sm"></Spinner> : '확인'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* Reset Confirm Dialog */}
			<Modal.Backdrop isOpen={resetConfirmOpen} onOpenChange={next => {
            if (!next)
                (() => setResetConfirmOpen(false))();
        }}><Modal.Container size="lg"><Modal.Dialog>
				<Modal.Heading>기본값으로 초기화</Modal.Heading>
				<Modal.Body>
					<p>설정을 기본값으로 초기화하시겠습니까?</p>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setResetConfirmOpen(false)} variant="tertiary">취소</Button>
					<Button isDisabled={resetLoading} onPress={handleReset} variant="primary">
						{resetLoading ? <Spinner size="sm"></Spinner> : '초기화'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>
		</div>);
}
