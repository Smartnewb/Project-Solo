'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Label, ListBox, Modal, Radio, RadioGroup, ComboBox, Spinner, TextArea, TextField, Description } from '@heroui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminService, { countriesForScope } from '@/app/services/admin';
import type {
  PushTargetGroup,
  CreateBroadcastScheduleRequest,
  ScheduleCreatedResult,
  PushLegalClass,
} from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { formatDateTimeKR } from '@/app/utils/formatters';

const MAX_TITLE = 100;
const MAX_BODY = 500;

type TargetType = 'all' | 'group';

interface GroupPreviewState {
  loading: boolean;
  kr?: number;
  jp?: number;
  total?: number;
}

export default function BroadcastFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { session } = useAdminSession();

  const [targetType, setTargetType] = useState<TargetType>('all');
  const [groups, setGroups] = useState<PushTargetGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<PushTargetGroup | null>(null);
  const [groupPreview, setGroupPreview] = useState<GroupPreviewState>({ loading: false });

  const [krTitle, setKrTitle] = useState('');
  const [krBody, setKrBody] = useState('');
  const [jpTitle, setJpTitle] = useState('');
  const [jpBody, setJpBody] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [legalClass, setLegalClass] = useState<PushLegalClass>('advertising');

  const [testUserId, setTestUserId] = useState('');
  const [testSendingCountry, setTestSendingCountry] = useState<'kr' | 'jp' | null>(null);
  const [testConfirmed, setTestConfirmed] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScheduleCreatedResult | null>(null);

  useEffect(() => {
    if (session?.user?.id) setTestUserId(session.user.id);
  }, [session?.user?.id]);

  const handleGroupPreview = async (groupId: string) => {
    setGroupPreview({ loading: true });
    try {
      const preview = await AdminService.pushGroups.preview(groupId);
      setGroupPreview({ loading: false, kr: preview.kr, jp: preview.jp, total: preview.total });
    } catch (error) {
      setGroupPreview({ loading: false });
      toast.error(getAdminErrorMessage(error, '예상 대상자 수를 불러오지 못했습니다.'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    setGroupsLoading(true);
    AdminService.pushGroups
      .list()
      .then((data) => {
        if (cancelled) return;
        setGroups(data);
        const groupId = searchParams.get('groupId');
        if (groupId) {
          const found = data.find((g) => g.id === groupId);
          if (found) {
            setTargetType('group');
            setSelectedGroup(found);
            handleGroupPreview(found.id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('그룹 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectGroup = (group: PushTargetGroup | null) => {
    setSelectedGroup(group);
    setGroupPreview({ loading: false });
    if (group) handleGroupPreview(group.id);
  };

  const handleTestSend = async (country: 'kr' | 'jp') => {
    const title = country === 'kr' ? krTitle : jpTitle;
    const body = country === 'kr' ? krBody : jpBody;
    if (!testUserId.trim()) {
      toast.error('테스트 발송할 관리자 userId를 입력해주세요.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast.error(`${country.toUpperCase()} 제목/본문을 먼저 입력해주세요.`);
      return;
    }
    setTestSendingCountry(country);
    try {
      const res = await AdminService.pushBroadcast.test({
        userId: testUserId.trim(),
        country,
        title: title.trim(),
        body: body.trim(),
        deepLink: deepLink.trim() || undefined,
        legalClass,
      });
      if (res.success) {
        toast.success(`${country.toUpperCase()} 테스트 푸시를 발송했습니다.`);
      } else {
        toast.error(`${country.toUpperCase()} 테스트 푸시 발송에 실패했습니다.`);
      }
    } catch (error) {
      toast.error(getAdminErrorMessage(error, '테스트 발송에 실패했습니다.'));
    } finally {
      setTestSendingCountry(null);
    }
  };

  // 발송 대상 국가: 전체=KR+JP, 그룹=그룹 countryScope. 필요한 국가 문구만 필수.
  const targetCountries: Array<'kr' | 'jp'> =
    targetType === 'all'
      ? ['kr', 'jp']
      : selectedGroup
        ? countriesForScope(selectedGroup.countryScope)
        : [];
  const needKr = targetCountries.includes('kr');
  const needJp = targetCountries.includes('jp');

  const krOk = !needKr || Boolean(krTitle.trim() && krBody.trim());
  const jpOk = !needJp || Boolean(jpTitle.trim() && jpBody.trim());
  const requiredTextFilled = (needKr || needJp) && krOk && jpOk;
  const targetReady = targetType === 'all' || Boolean(selectedGroup);
  const canSubmit = requiredTextFilled && Boolean(scheduledAt) && testConfirmed && targetReady;

  const handleOpenConfirm = () => {
    if (!scheduledAt) {
      toast.error('발송 예정 시각을 입력해주세요.');
      return;
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      toast.error('발송 예정 시각은 현재 이후여야 합니다.');
      return;
    }
    if (!canSubmit) return;
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const body: CreateBroadcastScheduleRequest = {
        ...(needKr ? { krTitle: krTitle.trim(), krBody: krBody.trim() } : {}),
        ...(needJp ? { jpTitle: jpTitle.trim(), jpBody: jpBody.trim() } : {}),
        deepLink: deepLink.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        legalClass,
        ...(targetType === 'group' && selectedGroup ? { targetGroupId: selectedGroup.id } : {}),
      };
      const created = await AdminService.pushBroadcast.schedule(body);
      setResult(created);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(getAdminErrorMessage(error, '예약 등록에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const targetSummary =
    targetType === 'all'
      ? '전체 활성유저'
      : selectedGroup
        ? `${selectedGroup.name} (예상 ${groupPreview.total !== undefined ? `${groupPreview.total.toLocaleString()}명` : '확인중'})`
        : '-';

  return (
    <section className="max-w-3xl space-y-6" aria-labelledby="broadcast-form-heading">
      <h1 id="broadcast-form-heading" className="text-2xl font-bold">예약 푸시 발송 등록</h1>
      <section className="space-y-4 rounded-xl border border-border bg-white p-6">
        <RadioGroup value={targetType} onChange={value => setTargetType(value as TargetType)} orientation="horizontal">
          <Label>발송 대상</Label>
          <Radio value="all"><Radio.Content><Radio.Control><Radio.Indicator /></Radio.Control><Label>전체 활성유저</Label></Radio.Content></Radio>
          <Radio value="group"><Radio.Content><Radio.Control><Radio.Indicator /></Radio.Control><Label>특정 그룹</Label></Radio.Content></Radio>
        </RadioGroup>
        {targetType === 'group' && <>
          <ComboBox defaultItems={groups} value={selectedGroup?.id ?? null} onChange={key => handleSelectGroup(groups.find(group => group.id === key) ?? null)} isDisabled={groupsLoading} fullWidth>
            <Label>타겟 그룹 선택</Label><ComboBox.InputGroup><Input placeholder="그룹 이름 검색" /><ComboBox.Trigger /></ComboBox.InputGroup>
            <ComboBox.Popover><ListBox<PushTargetGroup>>{group => <ListBox.Item id={group.id} textValue={group.name}>{group.name} ({group.type === 'static' ? '정적' : '동적'})</ListBox.Item>}</ListBox></ComboBox.Popover>
          </ComboBox>
          {selectedGroup && (groupPreview.loading ? <Spinner size="sm" aria-label="대상자 수 확인 중" /> : groupPreview.total !== undefined && <p className="text-sm text-gray-600">예상 대상자 수: KR {(groupPreview.kr ?? 0).toLocaleString()} · JP {(groupPreview.jp ?? 0).toLocaleString()} · 합계 {groupPreview.total.toLocaleString()}명</p>)}
        </>}
      </section>
      <section className="space-y-4 rounded-xl border border-border bg-white p-6">
        <RadioGroup value={legalClass} onChange={value => setLegalClass(value as PushLegalClass)} orientation="horizontal" isRequired><Label>발송 분류</Label><Radio value="advertising"><Radio.Content><Radio.Control><Radio.Indicator /></Radio.Control><Label>광고성 (이벤트·혜택·재방문 유도)</Label></Radio.Content></Radio><Radio value="informational"><Radio.Content><Radio.Control><Radio.Indicator /></Radio.Control><Label>정보성 (공지·거래·서비스 안내)</Label></Radio.Content></Radio></RadioGroup><p className="text-sm text-gray-600">광고성은 수신 동의한 회원에게만 발송되고 제목 앞에 (광고)가 붙습니다. 21시~08시에는 야간 동의 회원에게만 갑니다.</p><h2 className="text-base font-semibold">문구</h2>
        {targetType === 'group' && !selectedGroup ? <p role="status">먼저 발송 대상 그룹을 선택하면 필요한 국가 문구만 표시됩니다.</p> : <>
          {needKr && <><CopyField label="KR 제목" value={krTitle} onChange={setKrTitle} maxLength={MAX_TITLE} /><CopyField label="KR 본문" value={krBody} onChange={setKrBody} maxLength={MAX_BODY} multiline /></>}
          {needJp && <><CopyField label="JP 제목" value={jpTitle} onChange={setJpTitle} maxLength={MAX_TITLE} /><CopyField label="JP 본문" value={jpBody} onChange={setJpBody} maxLength={MAX_BODY} multiline /></>}
          <TextField value={deepLink} onChange={setDeepLink}><Label>딥링크</Label><Input placeholder="sometimes://home" /></TextField>
        </>}
      </section>
      <section className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-base font-semibold">발송 예정 시각</h2>
        <TextField value={scheduledAt} onChange={setScheduledAt}><Label>발송 예정 시각 (기기 현지 시간)</Label><Input type="datetime-local" /><Description>입력한 시간은 기기의 시간대를 기준으로 서버에 전달합니다. 확인창에는 한국 시간으로 표시됩니다.</Description></TextField>
      </section>
      <section className="space-y-4 rounded-xl border border-border bg-white p-6">
        <h2 className="text-base font-semibold">테스트 발송 (필수)</h2>
        <p>예약 등록 전 반드시 테스트 발송으로 문구를 확인해야 합니다.</p>
        <TextField value={testUserId} onChange={setTestUserId}><Label>테스트 수신 관리자 userId</Label><Input /></TextField>
        <div className="flex flex-wrap gap-3">
          {needKr && <Button variant="secondary" onPress={() => handleTestSend('kr')} isDisabled={testSendingCountry !== null}>KR 문구 테스트 발송{testSendingCountry === 'kr' && <Spinner size="sm" />}</Button>}
          {needJp && <Button variant="secondary" onPress={() => handleTestSend('jp')} isDisabled={testSendingCountry !== null}>JP 문구 테스트 발송{testSendingCountry === 'jp' && <Spinner size="sm" />}</Button>}
        </div>
        <Checkbox isSelected={testConfirmed} onChange={setTestConfirmed}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Label>테스트 푸시를 수신했음을 확인했습니다.</Label></Checkbox.Content></Checkbox>
      </section>
      <div className="flex justify-end"><Button isDisabled={!canSubmit || submitting} onPress={handleOpenConfirm}>예약 등록</Button></div>
      <Modal.Backdrop isOpen={confirmOpen} onOpenChange={open => !submitting && setConfirmOpen(open)} isDismissable={!submitting} isKeyboardDismissDisabled={submitting}><Modal.Container size="md"><Modal.Dialog><Modal.Header><Modal.Heading>예약 발송 최종 확인</Modal.Heading></Modal.Header>
          <Modal.Body><p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-amber-900">주의: 예약 등록 후에는 취소할 수 없습니다. 등록 즉시 예약이 확정됩니다.</p>
            <dl className="space-y-3"><SummaryRow label="발송 분류" value={legalClass === 'advertising' ? '광고성' : '정보성'} /><SummaryRow label="발송 대상" value={targetSummary} /><SummaryRow label="예정 시각" value={formatDateTimeKR(scheduledAt)} />{needKr && <SummaryRow label="KR 제목" value={krTitle} />}{needJp && <SummaryRow label="JP 제목" value={jpTitle} />}<SummaryRow label="딥링크" value={deepLink || '-'} /></dl>
          </Modal.Body><Modal.Footer><Button variant="secondary" onPress={() => setConfirmOpen(false)} isDisabled={submitting}>취소</Button><Button onPress={handleConfirmSubmit} isDisabled={submitting}>예약 등록 진행{submitting && <Spinner size="sm" />}</Button></Modal.Footer>
        </Modal.Dialog></Modal.Container></Modal.Backdrop>
      <Modal.Backdrop isOpen={Boolean(result)} isDismissable={false} isKeyboardDismissDisabled><Modal.Container size="sm"><Modal.Dialog><Modal.Header><Modal.Heading>예약 등록 완료</Modal.Heading></Modal.Header><Modal.Body>
          <p>예약 ID: {result?.id}</p><p>예상 대상 인원: {result?.targetPreviewCount.toLocaleString()}명</p><p>발송 예정 시각: {result ? formatDateTimeKR(result.scheduledAt) : '-'}</p>
        </Modal.Body><Modal.Footer><Button onPress={() => router.push('/admin/broadcast-push')}>이력 보기</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
    </section>
  );
}

function CopyField({ label, value, onChange, maxLength, multiline }: { label: string; value: string; onChange: (value: string) => void; maxLength: number; multiline?: boolean }) {
  return <TextField value={value} onChange={onChange} isRequired><Label>{label}</Label>{multiline ? <TextArea rows={3} maxLength={maxLength} /> : <Input maxLength={maxLength} />}<Description>{value.length}/{maxLength}</Description></TextField>;
}
function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="grid grid-cols-[100px_1fr] gap-4 text-sm"><dt className="text-gray-600">{label}</dt><dd className="break-words">{value}</dd></div>;
}
