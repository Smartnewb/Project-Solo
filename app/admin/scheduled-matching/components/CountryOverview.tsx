'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, Input } from '@heroui/react';
import { RefreshCw as RefreshIcon, Play as PlayArrowIcon, Square as StopIcon, Map as MapIcon, Rocket as RocketLaunchIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { scheduledMatchingService } from '../service';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import type { Country, ScheduledMatchingConfig, JobStatus, BatchHistory, ScheduleMatchingResponse } from '../types';
import type { MatchingPoolStatsResponse, MatchingPoolCountry, MatchTypeStats } from '@/types/admin';
type MatchingType = 'scheduled' | 'rematching';
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
    };
};
import { safeToLocaleString, safeToLocaleDateString } from '@/app/utils/formatters';
import { parseCronToHumanReadable, formatNextExecution, getTimeDiff } from '../utils';
import RegionMapView from './RegionMapView';
interface CountryCardProps {
    country: Country;
    config: ScheduledMatchingConfig | null;
    jobStatus: JobStatus | null;
    lastBatch: BatchHistory | null;
    onTrigger: (country: Country) => void;
    triggering: boolean;
}
function CountryCard({ country, config, jobStatus, lastBatch, onTrigger, triggering, }: CountryCardProps) {
    const countryInfo = {
        KR: { flag: '🇰🇷', name: '한국', timezone: 'KST' },
        JP: { flag: '🇯🇵', name: '일본', timezone: 'JST' },
    };
    const info = countryInfo[country];
    const isEnabled = config?.isEnabled ?? false;
    const successRate = lastBatch
        ? lastBatch.totalUsers > 0
            ? ((lastBatch.successCount / lastBatch.totalUsers) * 100).toFixed(1)
            : '0.0'
        : null;
    return (<section style={{ padding: 24, height: '100%' }} className="rounded-xl border bg-white p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="text-lg font-semibold">
          {info.flag} {info.name}
        </h2>
        <Chip size="sm">{isEnabled ? '활성화' : '비활성화'}</Chip>
      </div>

      {!config ? (<p>설정 없음</p>) : (<>
          <div style={{ marginBottom: 16 }}>
            <p>
              스케줄
            </p>
            <p>
              {parseCronToHumanReadable(config.cronExpression)} ({info.timezone})
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p>
              다음 실행
            </p>
            {jobStatus?.nextExecution ? (<div>
                <p>
                  {formatNextExecution(jobStatus.nextExecution)}
                </p>
                <p>
                  {getTimeDiff(jobStatus.nextExecution)}
                </p>
              </div>) : (<p>
                예정 없음
              </p>)}
          </div>

          {lastBatch && (<div style={{ marginBottom: 16 }}>
              <p>
                최근 실행 ({safeToLocaleDateString(lastBatch.startedAt)})
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <progress value={parseFloat(successRate || '0')} style={{ height: 8, borderRadius: 4 }} aria-label="처리 중"></progress>
                <p>
                  {successRate}%
                </p>
              </div>
              <p>
                {lastBatch.totalUsers}명 중 {lastBatch.successCount}명 성공
              </p>
            </div>)}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button onPress={() => onTrigger(country)} isDisabled={triggering} variant="primary">
              {triggering ? (<Spinner size="sm" style={{ marginRight: 8 }}></Spinner>) : (<PlayArrowIcon style={{ fontSize: 16, marginRight: 4 }}></PlayArrowIcon>)}
              수동 실행
            </Button>
          </div>
        </>)}
    </section>);
}
interface RunningBatchAlertProps {
    batch: BatchHistory;
    onCancel: (batchId: string) => void;
    cancelling: boolean;
}
function RunningBatchAlert({ batch, onCancel, cancelling }: RunningBatchAlertProps) {
    const progress = batch.totalUsers > 0
        ? Math.round((batch.processedUsers / batch.totalUsers) * 100)
        : 0;
    const countryFlag = batch.country === 'KR' ? '🇰🇷' : '🇯🇵';
    return (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
        <p>
          {countryFlag} {batch.country} 배치 실행 중
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <progress value={progress} style={{ height: 6, borderRadius: 3 }} aria-label="처리 중"></progress>
          <p>
            {batch.processedUsers}/{batch.totalUsers}명 ({progress}%)
          </p>
        </div>
      </div>
    </aside>);
}
export default function CountryOverview() {
    const confirm = useConfirm();
    const { session } = useAdminSession();
    const [configs, setConfigs] = useState<ScheduledMatchingConfig[]>([]);
    const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);
    const [runningBatches, setRunningBatches] = useState<BatchHistory[]>([]);
    const [lastBatches, setLastBatches] = useState<Record<Country, BatchHistory | null>>({
        KR: null,
        JP: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [triggering, setTriggering] = useState<Country | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [mapCountry, setMapCountry] = useState<MatchingPoolCountry>('KR');
    const [mapStats, setMapStats] = useState<MatchingPoolStatsResponse | null>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [matchingType, setMatchingType] = useState<MatchingType>('scheduled');
    const [dateRange, setDateRange] = useState(getDefaultDateRange);
    // Schedule matching state
    const [scheduleCountry, setScheduleCountry] = useState<Country>('KR');
    const [scheduleExecuting, setScheduleExecuting] = useState(false);
    const [scheduleResult, setScheduleResult] = useState<ScheduleMatchingResponse | null>(null);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false);
    // POST /admin/matching/schedule 는 body 에 country 가 없고 X-Country 헤더(세션 국가)로만 대상 국가가 정해진다.
    // 세션 국가와 선택 국가가 다르면 엉뚱한 국가가 실행되므로 실행을 막는다.
    const sessionCountry = session?.selectedCountry?.toUpperCase();
    const scheduleCountryMismatch = sessionCountry !== scheduleCountry;
    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [configsRes, jobStatusRes, runningRes] = await Promise.all([
                scheduledMatchingService.getAllConfigs(),
                scheduledMatchingService.getAllJobStatus(),
                scheduledMatchingService.getRunningBatches(),
            ]);
            setConfigs(configsRes);
            setJobStatuses(jobStatusRes);
            setRunningBatches(runningRes);
            const batchPromises = (['KR', 'JP'] as Country[]).map(async (country) => {
                try {
                    const batches = await scheduledMatchingService.getBatchesByCountry(country, 1, 0);
                    return { country, batch: batches[0] || null };
                }
                catch {
                    return { country, batch: null };
                }
            });
            const batchResults = await Promise.all(batchPromises);
            const newLastBatches: Record<Country, BatchHistory | null> = { KR: null, JP: null };
            batchResults.forEach(({ country, batch }) => {
                newLastBatches[country] = batch;
            });
            setLastBatches(newLastBatches);
        }
        catch {
            setError('데이터를 불러오는데 실패했습니다.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);
    const fetchMapStats = useCallback(async (country: MatchingPoolCountry, startDate: string, endDate: string) => {
        try {
            setMapLoading(true);
            setMapError(null);
            const stats = await scheduledMatchingService.getMatchingPoolStats(country, startDate, endDate);
            setMapStats(stats);
        }
        catch {
            setMapError('지도 데이터를 불러오는데 실패했습니다.');
            setMapStats(null);
        }
        finally {
            setMapLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchMapStats(mapCountry, dateRange.startDate, dateRange.endDate);
    }, [mapCountry, dateRange, fetchMapStats]);
    const handleMapCountryChange = (_: React.MouseEvent<HTMLElement>, newCountry: MatchingPoolCountry | null) => {
        if (newCountry) {
            setMapCountry(newCountry);
        }
    };
    const handleMatchingTypeChange = (_: React.MouseEvent<HTMLElement>, newType: MatchingType | null) => {
        if (newType) {
            setMatchingType(newType);
        }
    };
    const handleDateChange = (field: 'startDate' | 'endDate') => (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [field]: e.target.value }));
    };
    const currentStats: MatchTypeStats | null = mapStats ? mapStats[matchingType] : null;
    const handleTrigger = async (country: Country) => {
        const ok = await confirm({
            title: '수동 실행',
            message: `${country === 'KR' ? '한국' : '일본'} 정기 매칭을 지금 수동 실행합니다. (${formatDate(new Date())})`,
            confirmText: '실행',
            severity: 'warning',
        });
        if (!ok)
            return;
        try {
            setTriggering(country);
            await scheduledMatchingService.triggerManualExecution(country);
            fetchData();
        }
        catch {
            setError('수동 실행에 실패했습니다.');
        }
        finally {
            setTriggering(null);
        }
    };
    const handleCancelBatch = async (batchId: string) => {
        try {
            setCancelling(batchId);
            await scheduledMatchingService.cancelBatch(batchId);
            fetchData();
        }
        catch {
            setError('배치 취소에 실패했습니다.');
        }
        finally {
            setCancelling(null);
        }
    };
    const handleScheduleMatching = async () => {
        setScheduleConfirmOpen(false);
        if (scheduleCountryMismatch)
            return;
        try {
            setScheduleExecuting(true);
            setScheduleError(null);
            setScheduleResult(null);
            const today = formatDate(new Date());
            const result = await scheduledMatchingService.executeScheduleMatching({
                targetDate: today,
            });
            setScheduleResult(result);
            fetchData();
        }
        catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : '스케줄 매칭 실행에 실패했습니다.';
            setScheduleError(errorMessage);
        }
        finally {
            setScheduleExecuting(false);
        }
    };
    const getConfigForCountry = (country: Country) => configs.find((c) => c.country === country) || null;
    const getJobStatusForCountry = (country: Country) => jobStatuses.find((s) => s.country === country) || null;
    if (loading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, paddingBlock: 32 }}>
        <Spinner size="sm"></Spinner>
        <p>
          정기 매칭 현황을 불러오는 중입니다.
        </p>
      </div>);
    }
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="text-lg font-semibold">국가별 현황</h2>
        <span title={"새로고침"}>
          <Button onPress={fetchData} aria-label="국가별 정기 매칭 현황 새로고침" variant="tertiary" isIconOnly={true}>
            <RefreshIcon></RefreshIcon>
          </Button>
        </span>
      </div>

      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {error}
        </aside>)}

      {runningBatches.map((batch) => (<RunningBatchAlert key={batch.id} batch={batch} onCancel={handleCancelBatch} cancelling={cancelling === batch.id}></RunningBatchAlert>))}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(['KR', 'JP'] as Country[]).map((country) => (<div key={country} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CountryCard country={country} config={getConfigForCountry(country)} jobStatus={getJobStatusForCountry(country)} lastBatch={lastBatches[country]} onTrigger={handleTrigger} triggering={triggering === country}></CountryCard>
          </div>))}
      </div>

      {/* 수동 스케줄 매칭 실행 */}
      <section style={{ marginTop: 32, padding: 24 }} className="rounded-xl border bg-white p-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <RocketLaunchIcon></RocketLaunchIcon>
          <h2 className="text-lg font-semibold">수동 스케줄 매칭 실행</h2>
        </div>

        <p style={{ marginBottom: 16 }}>
          오늘 날짜 기준으로 적격 유저들의 스케줄 매칭을 수동으로 실행합니다.
          매칭은 Queue를 통해 순차 처리됩니다.
        </p>

        {scheduleError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
            {scheduleError}
          </aside>)}

        {scheduleResult && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
            {scheduleResult.message}
            <br></br>
            <p>
              대상 유저: {scheduleResult.eligibleUsersCount}명 | 배치 ID: {scheduleResult.batchId}
            </p>
          </aside>)}

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <div className="flex gap-2" aria-label="수동 스케줄 매칭 국가 선택">{(['KR', 'JP'] as const).map(country => <Button key={country} variant={scheduleCountry === country ? 'primary' : 'secondary'} aria-pressed={scheduleCountry === country} onPress={() => setScheduleCountry(country)}>{country === 'KR' ? '한국' : '일본'}</Button>)}</div>

          <p>
            대상일: {formatDate(new Date())}
          </p>

          <Button onPress={() => setScheduleConfirmOpen(true)} isDisabled={scheduleExecuting || scheduleCountryMismatch} variant="tertiary">
            {scheduleExecuting ? (<Spinner size="sm" style={{ marginRight: 8 }}></Spinner>) : (<PlayArrowIcon style={{ fontSize: 18, marginRight: 4 }}></PlayArrowIcon>)}
            스케줄 매칭 실행
          </Button>
        </div>
        {scheduleCountryMismatch && (<p role="status" className="text-sm" style={{ marginTop: -16, marginBottom: 16 }}>
            이 실행은 상단에서 선택한 운영 국가({sessionCountry ?? '확인 불가'})로만 동작합니다. {scheduleCountry === 'KR' ? '한국' : '일본'}에 실행하려면 운영 국가를 먼저 전환해주세요.
          </p>)}

        <hr style={{ marginBlock: 16 }}></hr>

        {/* 현재 매칭 필터 설정 표시 */}
        {(() => {
            const currentConfig = getConfigForCountry(scheduleCountry);
            if (!currentConfig) {
                return (<aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 16 }}>
                {scheduleCountry === 'KR' ? '한국' : '일본'} 설정이 없습니다. 스케줄 설정 탭에서 먼저 설정을 생성해주세요.
              </aside>);
            }
            return (<div>
              <p>
                현재 매칭 필터 설정 ({scheduleCountry === 'KR' ? '한국' : '일본'})
              </p>
              <div style={{ marginTop: 8 }} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="min-w-0">
                  <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <p>
                      로그인 기준일
                    </p>
                    <h2 className="text-lg font-semibold">
                      {currentConfig.loginWindowDays ?? 60}일
                    </h2>
                    <p>
                      최근 {currentConfig.loginWindowDays ?? 60}일 이내 로그인한 유저만 대상
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <p>
                      등급 미분류 포함
                    </p>
                    <h2 className="text-lg font-semibold">
                      <Chip size="sm">{currentConfig.includeUnknownRank ? 'ON' : 'OFF'}</Chip>
                    </h2>
                    <p>
                      {currentConfig.includeUnknownRank
                    ? '등급이 아직 정리되지 않은 유저 포함'
                    : '등급이 아직 정리되지 않은 유저 제외'}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <p>
                      스케줄 상태
                    </p>
                    <h2 className="text-lg font-semibold">
                      <Chip size="sm">{currentConfig.isEnabled ? '활성화' : '비활성화'}</Chip>
                    </h2>
                    <p>
                      {currentConfig.cronExpression}
                    </p>
                  </div>
                </div>
              </div>
              <aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 16 }}>
                매칭 필터 설정을 변경하려면 <strong>스케줄 설정</strong> 탭에서 수정해주세요.
              </aside>
            </div>);
        })()}
      </section>

      <Modal.Backdrop isOpen={scheduleConfirmOpen} onOpenChange={next => {
            if (!next)
                (() => setScheduleConfirmOpen(false))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
        <Modal.Heading>스케줄 매칭 실행</Modal.Heading>
        <Modal.Body>
          <p>
            {scheduleCountry === 'KR' ? '한국' : '일본'} 오늘자 스케줄 매칭을 실행합니다. 매칭은 Queue를 통해 순차 처리됩니다.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={() => setScheduleConfirmOpen(false)} variant="tertiary">
            닫기
          </Button>
          <Button onPress={handleScheduleMatching} isDisabled={scheduleExecuting} variant="primary">
            실행
          </Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>

      <section style={{ marginTop: 32, padding: 24 }} className="rounded-xl border bg-white p-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapIcon></MapIcon>
            <h2 className="text-lg font-semibold">매칭풀 지역별 현황</h2>
          </div>
          <span title={"지도 새로고침"}>
            <Button onPress={() => fetchMapStats(mapCountry, dateRange.startDate, dateRange.endDate)} isDisabled={mapLoading} aria-label="매칭풀 지역별 현황 새로고침" variant="tertiary" isIconOnly={true}>
              <RefreshIcon></RefreshIcon>
            </Button>
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'center' }}>
          <TextField className="mb-4"><Label>{"시작일"}</Label><Input type="date" value={dateRange.startDate} onChange={handleDateChange('startDate')}></Input></TextField>
          <TextField className="mb-4"><Label>{"종료일"}</Label><Input type="date" value={dateRange.endDate} onChange={handleDateChange('endDate')}></Input></TextField>
          <div className="flex gap-2" aria-label="매칭풀 지역별 현황 국가 필터">{(['KR', 'JP'] as const).map(country => <Button key={country} variant={mapCountry === country ? 'primary' : 'secondary'} aria-pressed={mapCountry === country} onPress={() => handleMapCountryChange({} as never, country)}>{country === 'KR' ? '한국' : '일본'}</Button>)}</div>
          <div className="flex gap-2" aria-label="매칭풀 지역별 현황 유형 필터">{(['scheduled', 'rematching'] as const).map(type => <Button key={type} variant={matchingType === type ? 'primary' : 'secondary'} aria-pressed={matchingType === type} onPress={() => handleMatchingTypeChange({} as never, type)}>{type === 'scheduled' ? '스케줄 매칭' : '재매칭'}</Button>)}</div>
        </div>

        {mapError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
            {mapError}
          </aside>)}

        {mapLoading ? (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 1000 }}>
            <Spinner size="sm"></Spinner>
          </div>) : currentStats ? (<>
            <div style={{ marginBottom: 16 }}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="min-w-0">
                  <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <h1 className="text-2xl font-bold">
                      {currentStats.summary.totalUsers.toLocaleString()}
                    </h1>
                    <p>
                      총 유저
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <h1 className="text-2xl font-bold">
                      {currentStats.summary.genderRatio !== null
                ? `${currentStats.summary.genderRatio.toFixed(2)}:1`
                : 'N/A'}
                    </h1>
                    <p>
                      성비 (남/여)
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <h1 className="text-2xl font-bold">
                      {currentStats.summary.avgAge.toFixed(1)}세
                    </h1>
                    <p>
                      평균 나이
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <h1 className="text-2xl font-bold">
                      {(currentStats.summary.overallMutualLikeRate * 100).toFixed(1)}%
                    </h1>
                    <p>
                      상호 좋아요율
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <h1 className="text-2xl font-bold">
                      {(currentStats.summary.overallLikeConversionRate * 100).toFixed(1)}%
                    </h1>
                    <p>
                      좋아요 전환율
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 1 }}>
                    <h1 className="text-2xl font-bold">
                      {(currentStats.summary.overallMatchToChatRate * 100).toFixed(1)}%
                    </h1>
                    <p>
                      채팅 전환율
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <RegionMapView data={{ country: mapCountry, regions: currentStats.regions }}></RegionMapView>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>
                  <p>남초</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#8B5CF6' }}></div>
                  <p>균형</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#EC4899' }}></div>
                  <p>여초</p>
                </div>
              </div>
              <p>
                업데이트: {mapStats && safeToLocaleString(mapStats.cachedAt)}
              </p>
            </div>
          </>) : (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 1000 }}>
            <div style={{ textAlign: 'center' }}>
              <p>
                지역별 매칭풀 데이터가 없습니다.
              </p>
              <p style={{ marginTop: 4 }}>
                날짜 범위와 국가, 매칭 유형을 변경한 뒤 다시 확인하세요.
              </p>
            </div>
          </div>)}
      </section>
    </div>);
}
