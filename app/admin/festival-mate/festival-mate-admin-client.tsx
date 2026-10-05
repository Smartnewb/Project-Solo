'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Button, Spinner } from '@heroui/react';
import { Download, GraduationCap, PartyPopper, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { festivalMate, loadFestivalApplicants, type FestivalCountry, type FestivalEvent } from '@/app/services/admin/festival-mate';
import { userAppearance } from '@/app/services/admin/users';
import type { UserDetail } from '@/components/admin/appearance/UserDetailModal';
import { applicantsCsv, approvalLabel, festivalPhase, festivalYear, filterApplicants, formatFestivalTime, isTodayKst, membershipLabel, type ApplicantFilters } from './lib';

const UserDetailModal = dynamic(() => import('@/components/admin/appearance/UserDetailModal'), { ssr: false });
const fieldClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200';
const emptyFilters: ApplicantFilters = { search: '', university: '', gender: '', approval: '', category: '' };
const PAGE_SIZE = 20;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700">{label}{children}</label>;
}

function ErrorNotice({ message }: { message: string }) {
  return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</p>;
}

export default function FestivalMateAdminClient() {
  const { session } = useAdminSession();
  const country = session?.selectedCountry.toLowerCase();
  if (country !== 'kr' && country !== 'jp') return <ErrorNotice message="운영 국가를 먼저 선택해주세요." />;
  // Remount everything on country switch, including the selected member modal and filters.
  return <CountryFestivals key={country} country={country} />;
}

function CountryFestivals({ country }: { country: FestivalCountry }) {
  const [host, setHost] = useState('');
  const [year, setYear] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const queryClient = useQueryClient();
  const eventsQuery = useQuery({
    queryKey: ['festival-mate', country, 'events'],
    queryFn: ({ signal }) => festivalMate.getEvents(country, signal),
    staleTime: 30_000,
    retry: false,
  });
  const events = eventsQuery.data ?? [];
  const hosts = Array.from(new Set(events.map((event) => event.location))).sort();
  const years = Array.from(new Set(events.map(festivalYear))).sort().reverse();
  const available = events.filter((event) => (!host || event.location === host) && (!year || festivalYear(event) === year))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const event = available.find((item) => item.id === selectedId)
    ?? available.find((item) => ['사전 신청', '진행 중'].includes(festivalPhase(item)))
    ?? available[0];

  return <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><PartyPopper size={25} />축제 메이트</h1>
        <p className="mt-2 text-sm text-gray-600">학교·연도·축제별 신청자 관리 · {country.toUpperCase()} · 모든 시각은 한국 시간(KST)</p>
      </div>
      <Button variant="secondary" isDisabled={eventsQuery.isFetching} onPress={() => { void queryClient.invalidateQueries({ queryKey: ['festival-mate', country] }); }}>
        <RefreshCw size={16} />새로고침
      </Button>
    </header>
    {eventsQuery.error && <ErrorNotice message={`축제 목록을 불러오지 못했습니다. ${getAdminErrorMessage(eventsQuery.error)}${eventsQuery.data ? ' 이전 조회 결과를 표시합니다.' : ''}`} />}
    {eventsQuery.isPending ? <div role="status" className="flex items-center gap-3 p-8"><Spinner size="sm" />축제 목록 조회 중</div>
      : eventsQuery.data && <>
        <section aria-label="축제 선택" className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 md:grid-cols-[1fr_140px_2fr]">
          <Field label="개최 학교·장소">
            <select className={fieldClass} value={host} onChange={(e) => { setHost(e.target.value); setSelectedId(''); }}>
              <option value="">전체 학교·장소</option>{hosts.map((location) => <option key={location} value={location}>{location || '개최지 미등록'}</option>)}
            </select>
          </Field>
          <Field label="개최 연도">
            <select className={fieldClass} value={year} onChange={(e) => { setYear(e.target.value); setSelectedId(''); }}>
              <option value="">전체 연도</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="축제">
            <select className={fieldClass} value={event?.id ?? ''} onChange={(e) => setSelectedId(e.target.value)} disabled={!available.length}>
              {!available.length && <option value="">조건에 맞는 축제 없음</option>}
              {available.map((item) => <option key={item.id} value={item.id}>{festivalYear(item)} · {item.location} · {item.name}</option>)}
            </select>
          </Field>
        </section>
        {!events.length && <p className="rounded-xl border border-dashed p-8 text-center text-gray-600">이 국가에 등록된 축제/오프라인 행사가 없습니다.</p>}
        {event && <FestivalWorkspace key={event.id} event={event} country={country} onHostRenamed={(previous, next) => {
          setHost((current) => current === previous ? next : current);
        }} />}
      </>}
  </div>;
}

function FestivalWorkspace({ event, country, onHostRenamed }: { event: FestivalEvent; country: FestivalCountry; onHostRenamed: (previous: string, next: string) => void }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(event.name);
  const [location, setLocation] = useState(event.location);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const participantsQuery = useQuery({
    queryKey: ['festival-mate', country, event.id, 'participants'],
    queryFn: ({ signal }) => festivalMate.getParticipants(event.id, signal),
    staleTime: 30_000,
    retry: false,
  });
  const applicantsQuery = useQuery({
    queryKey: ['festival-mate', country, event.id, 'profiles', participantsQuery.data],
    queryFn: ({ signal }) => loadFestivalApplicants(participantsQuery.data ?? [], (userId) => festivalMate.getProfile(userId, country, signal), signal),
    enabled: !!participantsQuery.data,
    staleTime: 30_000,
    retry: false,
  });
  const detailQuery = useQuery<UserDetail>({
    queryKey: ['festival-mate', country, event.id, 'member-detail', selectedUserId],
    queryFn: async () => {
      const detail: UserDetail = await userAppearance.getUserDetails(selectedUserId!);
      if (detail.id !== selectedUserId || detail.country?.toLowerCase() !== country) throw new Error('회원 ID 또는 국가가 일치하지 않습니다.');
      return detail;
    },
    enabled: !!selectedUserId,
    retry: false,
    staleTime: 0,
  });
  const metadataMutation = useMutation({
    mutationFn: (values: Pick<FestivalEvent, 'name' | 'location'>) => festivalMate.updateEvent(event.id, values),
    onSuccess: async (_updated, values) => {
      // Update metadata and its host filter together; a rename must not hide the just-saved festival.
      queryClient.setQueryData<FestivalEvent[]>(['festival-mate', country, 'events'], (current) => current?.map((item) => item.id === event.id ? { ...item, ...values } : item));
      onHostRenamed(event.location, values.location);
      setEditing(false);
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: ['festival-mate', country, 'events'] });
    },
  });
  const rows = applicantsQuery.data ?? [];
  const visibleRows = filterApplicants(rows, filters);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const universities = Array.from(new Set(rows.flatMap((row) => row.profile?.universityName ? [row.profile.universityName] : []))).sort();
  const failed = rows.filter((row) => !row.profile).length;
  const updateFilter = (key: keyof ApplicantFilters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const refreshing = participantsQuery.isFetching || applicantsQuery.isFetching;
  const totalsReady = !!participantsQuery.data && !participantsQuery.error;
  const profilesReady = !!applicantsQuery.data && !applicantsQuery.error;
  const download = () => {
    const url = URL.createObjectURL(new Blob([applicantsCsv(event, visibleRows)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `festival-${event.id}-applicants.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const refreshMember = () => {
    void queryClient.invalidateQueries({ queryKey: ['festival-mate', country, event.id] });
  };

  return <>
    <section aria-label="축제 정보" className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-violet-700"><GraduationCap size={18} />개최 학교·장소: {event.location || '미등록'}</p>
          <h2 className="mt-1 text-xl font-semibold">{event.name} <span className="text-sm font-normal text-gray-600">{festivalYear(event)} · {festivalPhase(event)}</span></h2>
          <p className="mt-2 text-sm text-gray-600">{formatFestivalTime(event.startsAt)} ~ {formatFestivalTime(event.endsAt)}</p>
          <p className="mt-1 break-all text-xs text-gray-500">축제 ID: {event.id} · 경로: {event.slug ?? '없음'}</p>
        </div>
        <Button variant="secondary" onPress={() => { setName(event.name); setLocation(event.location); setFormError(''); metadataMutation.reset(); setSaved(false); setEditing(!editing); }} isDisabled={metadataMutation.isPending}>축제 정보 수정</Button>
      </div>
      {saved && <p role="status" className="mt-3 text-sm text-green-800">축제 정보를 저장했습니다.</p>}
      {editing && <form className="mt-4 space-y-3 border-t border-violet-200 pt-4" onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !location.trim()) { setFormError('축제 이름과 개최 학교·장소를 입력해주세요.'); return; }
        setFormError(''); metadataMutation.mutate({ name: name.trim(), location: location.trim() });
      }}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="축제 이름"><input className={fieldClass} required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} disabled={metadataMutation.isPending} /></Field>
          <Field label="개최 학교·장소 수정"><input className={fieldClass} required maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} disabled={metadataMutation.isPending} placeholder="예: 국립한밭대학교" /></Field>
        </div>
        <p className="text-xs text-gray-600">개최 학교·장소는 축제의 개최지입니다. 신청자 소속 학교나 참가 자격을 변경하지 않습니다. 앱의 행사 이름·장소에도 반영됩니다.</p>
        {(formError || metadataMutation.error) && <ErrorNotice message={formError || getAdminErrorMessage(metadataMutation.error)} />}
        <div className="flex gap-2"><Button type="submit" isDisabled={metadataMutation.isPending}>{metadataMutation.isPending ? '저장 중…' : '저장'}</Button><Button type="button" variant="secondary" isDisabled={metadataMutation.isPending} onPress={() => setEditing(false)}>취소</Button></div>
      </form>}
    </section>
    <section aria-label="신청 요약" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ['전체 사전 신청', totalsReady ? participantsQuery.data.length : '—'],
        ['오늘 신청 (KST)', totalsReady ? participantsQuery.data.filter((row) => isTodayKst(row.joinedAt)).length : '—'],
        ['남성 · 여성 (회원 조회 기준)', profilesReady ? `${rows.filter((row) => row.profile?.gender?.toUpperCase() === 'MALE').length} · ${rows.filter((row) => row.profile?.gender?.toUpperCase() === 'FEMALE').length}` : '—'],
        ['회원 조회 실패', profilesReady ? failed : '—'],
      ].map(([label, value]) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-600">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
    </section>
    <p className="text-xs leading-relaxed text-gray-600">전체 신청은 사전 신청 기록 기준이며 테스트·가상 유저와 조회 실패 기록도 포함합니다. 메이트 프로필 작성·매칭 완료 수가 아닙니다. 현재 회원 API는 탈퇴 여부를 제공하지 않아 승인 여부나 조회 실패를 탈퇴로 판정하지 않습니다.</p>
    {participantsQuery.error && <ErrorNotice message={`신청 목록 조회 실패: ${getAdminErrorMessage(participantsQuery.error)}${participantsQuery.data ? ' 이전 조회 결과를 표시합니다.' : ''}`} />}
    {applicantsQuery.error && <ErrorNotice message={`회원 정보 조회 실패: ${getAdminErrorMessage(applicantsQuery.error)}`} />}
    {(participantsQuery.isPending || (participantsQuery.data && applicantsQuery.isPending)) && <div role="status" className="flex items-center gap-3 p-6"><Spinner size="sm" />신청자 정보 조회 중…</div>}
    {profilesReady && <section aria-label="신청자 관리" className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold">신청자 {visibleRows.length}명 <span className="text-sm font-normal text-gray-500">/ 전체 {rows.length}명</span></h2><p className="mt-1 text-xs text-gray-500">신청일은 KST · CSV에는 현재 필터 결과 전체가 포함됩니다.</p></div>
        <Button variant="secondary" isDisabled={refreshing || !visibleRows.length || !!participantsQuery.error} onPress={download}><Download size={16} />CSV 내려받기</Button>
      </div>
      {refreshing && <p role="status" className="text-sm text-gray-500">최신 정보 갱신 중…</p>}
      {failed > 0 && <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><span>{failed}명의 회원 정보 조회에 실패했습니다. 신청 기록은 유지됩니다.</span><Button variant="secondary" size="sm" isDisabled={refreshing} onPress={() => { void applicantsQuery.refetch(); }}>회원 정보 재조회</Button></div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="검색"><input className={fieldClass} value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="이름·닉네임·회원 ID" /></Field>
        <Field label="신청자 소속 학교"><select className={fieldClass} value={filters.university} onChange={(e) => updateFilter('university', e.target.value)}><option value="">전체 학교</option>{universities.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
        <Field label="성별"><select className={fieldClass} value={filters.gender} onChange={(e) => updateFilter('gender', e.target.value)}><option value="">전체 성별</option><option value="MALE">남성</option><option value="FEMALE">여성</option></select></Field>
        <Field label="프로필 승인"><select className={fieldClass} value={filters.approval} onChange={(e) => updateFilter('approval', e.target.value)}><option value="">전체 승인 상태</option><option value="approved">승인</option><option value="pending">미승인</option><option value="rejected">반려</option></select></Field>
        <Field label="운영 구분"><select className={fieldClass} value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">전체 기록</option><option value="real">테스트·가상 제외 (조회 성공)</option><option value="internal">테스트·가상 유저</option><option value="suspended">이용 정지</option><option value="failed">회원 조회 실패</option></select></Field>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <caption className="sr-only">{event.location} {event.name} 사전 신청자 목록</caption>
          <thead className="border-b bg-gray-50 text-xs text-gray-600"><tr>{['신청자', '소속 학교', '성별', '신청 시각 (KST)', '프로필·사진', '계정 확인', '관리'].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody>{visibleRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((row) => <tr key={row.userId} className="border-b border-gray-100 align-top">
            <td className="px-3 py-4"><p className="font-medium">{row.profile?.name || '회원 조회 실패'}</p><p className="text-xs text-gray-500">{row.profile?.nickname || '닉네임 미확인'}</p><p className="mt-1 font-mono text-[10px] text-gray-400">{row.userId}</p>{(row.profile?.isTest || row.profile?.isFaker) && <p className="mt-1 text-xs text-amber-700">{row.profile.isTest ? '테스트 ' : ''}{row.profile.isFaker ? '가상 유저' : ''}</p>}</td>
            <td className="px-3 py-4">{row.profile?.universityName || '확인 불가'}</td>
            <td className="px-3 py-4">{({ MALE: '남성', FEMALE: '여성' } as Record<string, string>)[row.profile?.gender?.toUpperCase() ?? ''] || '미확인'}</td>
            <td className="whitespace-nowrap px-3 py-4">{formatFestivalTime(row.joinedAt)}</td>
            <td className="px-3 py-4"><p>{approvalLabel(row.profile?.status)}</p>{row.profile && <p className="mt-1 text-xs text-gray-500">사진 {row.profile.images?.length ?? 0}장 · 승인 {row.profile.images?.filter((image) => image.reviewStatus.toLowerCase() === 'approved').length ?? 0}장</p>}</td>
            <td className="px-3 py-4"><p>{membershipLabel(row)}</p>{row.error && <p className="mt-1 max-w-48 break-words text-xs text-red-700">{row.error}</p>}</td>
            <td className="px-3 py-4"><Button size="sm" variant="secondary" isDisabled={!row.profile} onPress={() => setSelectedUserId(row.userId)} aria-label={`${row.profile?.name ?? row.userId} 회원 상세`}>회원 상세</Button></td>
          </tr>)}</tbody>
        </table>
        {!visibleRows.length && <p className="p-8 text-center text-sm text-gray-500">{rows.length ? '필터에 맞는 신청자가 없습니다.' : '아직 사전 신청자가 없습니다.'}</p>}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-600"><span>{currentPage} / {totalPages} 페이지</span><div className="flex gap-2"><Button variant="secondary" size="sm" isDisabled={currentPage <= 1} onPress={() => setPage(currentPage - 1)}>이전</Button><Button variant="secondary" size="sm" isDisabled={currentPage >= totalPages} onPress={() => setPage(currentPage + 1)}>다음</Button></div></div>
      <p className="text-xs text-gray-500">회원 상세에서 기존 프로필·학교·계정 관리 기능을 사용할 수 있습니다. 축제 신청 취소·운영 메모 저장 기능은 현재 지원하지 않습니다.</p>
    </section>}
    {selectedUserId && detailQuery.isPending && <div role="status" className="flex items-center gap-2"><Spinner size="sm" />회원 상세 조회 중…<Button size="sm" variant="secondary" onPress={() => setSelectedUserId(null)}>닫기</Button></div>}
    {selectedUserId && detailQuery.error && <div className="space-y-2"><ErrorNotice message={`회원 상세 조회 실패: ${getAdminErrorMessage(detailQuery.error)}`} /><Button size="sm" variant="secondary" onPress={() => { void detailQuery.refetch(); }}>재시도</Button><Button size="sm" variant="secondary" onPress={() => setSelectedUserId(null)}>닫기</Button></div>}
    {selectedUserId && detailQuery.data && !detailQuery.error && <UserDetailModal key={selectedUserId} open userId={selectedUserId} userDetail={detailQuery.data} loading={detailQuery.isFetching} error={null} onClose={() => setSelectedUserId(null)} onRefresh={refreshMember} />}
  </>;
}
