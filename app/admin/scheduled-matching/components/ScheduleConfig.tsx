'use client';
import { Button, Spinner, TextField, Label, Input, Description, Select, ListBox, Checkbox } from '@heroui/react';
import { ChevronDown as ExpandMoreIcon, ChevronUp as ExpandLessIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import { scheduledMatchingService } from '../service';
import type { Country, ScheduledMatchingConfig, CreateScheduledMatchingConfigRequest, UpdateScheduledMatchingConfigRequest } from '../types';
import { safeToLocaleString } from '@/app/utils/formatters';
import { parseCronToHumanReadable, CRON_PRESETS, TIMEZONE_OPTIONS } from '../utils';
export default function ScheduleConfig() {
    const { session } = useAdminSession();
    const [selectedCountry, setSelectedCountry] = useState<Country>('KR');
    const [configs, setConfigs] = useState<ScheduledMatchingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [formData, setFormData] = useState({
        isEnabled: false,
        cronExpression: '0 0 * * 4,0',
        timezone: 'Asia/Seoul',
        batchSize: 5,
        delayBetweenUsersMs: 120,
        maxRetryCount: 1,
        loginWindowDays: 60,
        includeUnknownRank: true,
        description: '',
    });
    const fetchConfigs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await scheduledMatchingService.getAllConfigs();
            setConfigs(data);
            const currentConfig = data.find((c) => c.country === selectedCountry);
            if (currentConfig) {
                setFormData({
                    isEnabled: currentConfig.isEnabled,
                    cronExpression: currentConfig.cronExpression,
                    timezone: currentConfig.timezone,
                    batchSize: currentConfig.batchSize,
                    delayBetweenUsersMs: currentConfig.delayBetweenUsersMs,
                    maxRetryCount: currentConfig.maxRetryCount,
                    loginWindowDays: currentConfig.loginWindowDays ?? 60,
                    includeUnknownRank: currentConfig.includeUnknownRank ?? true,
                    description: currentConfig.description || '',
                });
            }
        }
        catch {
            setError('설정을 불러오는데 실패했습니다.');
        }
        finally {
            setLoading(false);
        }
    }, [selectedCountry]);
    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);
    useEffect(() => {
        const currentConfig = configs.find((c) => c.country === selectedCountry);
        if (currentConfig) {
            setFormData({
                isEnabled: currentConfig.isEnabled,
                cronExpression: currentConfig.cronExpression,
                timezone: currentConfig.timezone,
                batchSize: currentConfig.batchSize,
                delayBetweenUsersMs: currentConfig.delayBetweenUsersMs,
                maxRetryCount: currentConfig.maxRetryCount,
                loginWindowDays: currentConfig.loginWindowDays ?? 60,
                includeUnknownRank: currentConfig.includeUnknownRank ?? true,
                description: currentConfig.description || '',
            });
        }
    }, [selectedCountry, configs]);
    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            const configExists = configs.some((c) => c.country === selectedCountry);
            if (configExists) {
                const updateData: UpdateScheduledMatchingConfigRequest = {
                    isEnabled: formData.isEnabled,
                    cronExpression: formData.cronExpression,
                    timezone: formData.timezone,
                    batchSize: formData.batchSize,
                    delayBetweenUsersMs: formData.delayBetweenUsersMs,
                    maxRetryCount: formData.maxRetryCount,
                    loginWindowDays: formData.loginWindowDays,
                    includeUnknownRank: formData.includeUnknownRank,
                    description: formData.description || undefined,
                    lastModifiedBy: session?.user?.email || undefined,
                };
                await scheduledMatchingService.updateConfig(selectedCountry, updateData);
                setSuccess('설정이 수정되었습니다.');
            }
            else {
                const createData: CreateScheduledMatchingConfigRequest = {
                    country: selectedCountry,
                    cronExpression: formData.cronExpression,
                    timezone: formData.timezone,
                    isEnabled: formData.isEnabled,
                    batchSize: formData.batchSize,
                    delayBetweenUsersMs: formData.delayBetweenUsersMs,
                    maxRetryCount: formData.maxRetryCount,
                    loginWindowDays: formData.loginWindowDays,
                    includeUnknownRank: formData.includeUnknownRank,
                    description: formData.description || undefined,
                };
                await scheduledMatchingService.createConfig(createData);
                setSuccess('설정이 생성되었습니다.');
            }
            fetchConfigs();
        }
        catch {
            setError('설정 저장에 실패했습니다.');
        }
        finally {
            setSaving(false);
        }
    };
    const handlePresetSelect = (cronValue: string) => {
        setFormData((prev) => ({ ...prev, cronExpression: cronValue }));
    };
    const currentConfig = configs.find((c) => c.country === selectedCountry);
    if (loading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 32 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    return (<div>
      <h2 className="text-lg font-semibold">
        스케줄 설정
      </h2>

      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {error}
        </aside>)}

      {success && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {success}
        </aside>)}

      <section style={{ padding: 24 }} className="rounded-xl border bg-white p-4">
        <div style={{ marginBottom: 24 }}>
          <label>국가 선택</label>
          <Select value={selectedCountry} aria-label={"국가 선택"} onChange={(key) => {
            const value = String(key ?? "");
            setSelectedCountry(value as Country);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
            <ListBox.Item id={"KR"} textValue={"\uD83C\uDDF0\uD83C\uDDF7 \uD55C\uAD6D"}>🇰🇷 한국</ListBox.Item>
            <ListBox.Item id={"JP"} textValue={"\uD83C\uDDEF\uD83C\uDDF5 \uC77C\uBCF8"}>🇯🇵 일본</ListBox.Item>
          </ListBox></Select.Popover></Select>
        </div>

        <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
          <p>
            기본 설정
          </p>

          <Checkbox isSelected={formData.isEnabled} onChange={checked => setFormData((prev) => ({ ...prev, isEnabled: checked }))} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{formData.isEnabled ? '활성화' : '비활성화'}</Checkbox.Content></Checkbox>

          <div style={{ marginBottom: 16 }}>
            <p>
              크론 스케줄
            </p>
            <TextField className="mb-4"><Input value={formData.cronExpression} onChange={(e) => setFormData((prev) => ({ ...prev, cronExpression: e.target.value }))} placeholder="0 0 * * 4,0"></Input></TextField>
            <p style={{ marginBottom: 8 }}>
              💡 {parseCronToHumanReadable(formData.cronExpression)}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CRON_PRESETS.map((preset) => (<Button key={preset.value} onPress={() => handlePresetSelect(preset.value)} variant="tertiary">
                  {preset.label}
                </Button>))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>타임존</label>
            <Select value={formData.timezone} aria-label={"타임존"} onChange={(key) => {
            const value = String(key ?? "");
            setFormData((prev) => ({ ...prev, timezone: value }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              {TIMEZONE_OPTIONS.map((tz) => (<ListBox.Item key={tz.value} id={tz.value} textValue={String(tz.label)}>
                  {tz.label}
                </ListBox.Item>))}
            </ListBox></Select.Popover></Select>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Button onPress={() => setShowAdvanced(!showAdvanced)} className="w-full justify-between" variant="tertiary">
            <span>고급 설정 (배치 파라미터)</span>
            {showAdvanced ? <ExpandLessIcon></ExpandLessIcon> : <ExpandMoreIcon></ExpandMoreIcon>}
          </Button>

          <div hidden={!showAdvanced}>
            <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 1, marginTop: 8 }}>
              <TextField className="mb-4"><Label>{"배치 사이즈"}</Label><Input type="number" value={formData.batchSize} onChange={(e) => setFormData((prev) => ({
            ...prev,
            batchSize: Math.min(50, Math.max(1, parseInt(e.target.value) || 1)),
        }))} {...{ min: 1, max: 50 }}></Input><Description>{"동시 처리 사용자 수 (1~50)"}</Description></TextField>

              <TextField className="mb-4"><Label>{"사용자간 지연 (ms)"}</Label><Input type="number" value={formData.delayBetweenUsersMs} onChange={(e) => setFormData((prev) => ({
            ...prev,
            delayBetweenUsersMs: Math.min(10000, Math.max(0, parseInt(e.target.value) || 0)),
        }))} {...{ min: 0, max: 10000 }}></Input><Description>{"각 사용자 처리 사이 대기 시간 (0~10000ms)"}</Description></TextField>

              <TextField className="mb-4"><Label>{"최대 재시도 횟수"}</Label><Input type="number" value={formData.maxRetryCount} onChange={(e) => setFormData((prev) => ({
            ...prev,
            maxRetryCount: Math.min(5, Math.max(0, parseInt(e.target.value) || 0)),
        }))} {...{ min: 0, max: 5 }}></Input><Description>{"매칭 실패 시 재시도 횟수 (0~5)"}</Description></TextField>

              <hr style={{ marginBlock: 16 }}></hr>
              <p>
                매칭 필터 설정
              </p>

              <TextField className="mb-4"><Label>{"로그인 기준일"}</Label><Input type="number" value={formData.loginWindowDays} onChange={(e) => setFormData((prev) => ({
            ...prev,
            loginWindowDays: Math.min(365, Math.max(1, parseInt(e.target.value) || 1)),
        }))} {...{ min: 1, max: 365 }}></Input><Description>{"최근 N일 이내 로그인한 사용자만 매칭 대상 (1~365)"}</Description></TextField>

              <Checkbox isSelected={formData.includeUnknownRank} onChange={checked => setFormData((prev) => ({ ...prev, includeUnknownRank: checked }))} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"등급 미분류 포함"}</Checkbox.Content></Checkbox>
              <p>
                등급이 아직 정리되지 않은 사용자도 매칭 대상에 포함
              </p>
            </div>
          </div>
        </div>

        <TextField className="mb-4"><Label>{"메모"}</Label><Input value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="설정에 대한 설명을 입력하세요"></Input></TextField>

        {currentConfig?.lastModifiedBy && (<p style={{ display: 'block', marginBottom: 16 }}>
            마지막 수정: {currentConfig.lastModifiedBy} (
            {currentConfig.updatedAt
                ? safeToLocaleString(currentConfig.updatedAt)
                : '-'}
            )
          </p>)}

        <hr style={{ marginBlock: 16 }}></hr>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onPress={fetchConfigs} isDisabled={saving} variant="tertiary">
            취소
          </Button>
          <Button onPress={handleSave} isDisabled={saving} variant="tertiary">
            {saving ? <Spinner size="sm" style={{ marginRight: 8 }}></Spinner> : null}
            저장
          </Button>
        </div>
      </section>
    </div>);
}
