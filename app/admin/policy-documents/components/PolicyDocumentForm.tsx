'use client';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Switch,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useAdminForm } from '@/app/admin/hooks/forms';
import {
  policyDocumentSchema,
  type PolicyDocumentFormValues,
} from '@/app/admin/hooks/forms/schemas/policy-document.schema';
import { useRegisterPolicyDocument } from '@/app/admin/hooks';
import { useUnsavedGuard } from '@/app/admin/hooks/use-unsaved-guard';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import type {
  PolicyDecision,
  PolicyDocumentType,
  RegisterPolicyDocumentRequest,
} from '@/types/admin';

const DOCUMENT_TYPE_LABELS: Record<PolicyDocumentType, string> = {
  TERMS_OF_SERVICE: '이용약관',
  PRIVACY_POLICY: '개인정보처리방침',
  DATA_COLLECTION_CONSENT: '개인정보 수집·이용 동의',
  SENSITIVE_INFO_CONSENT: '민감정보 처리 동의',
  THIRD_PARTY_PROVISION: '제3자 제공 동의',
  MARKETING_CONSENT: '마케팅 수신 동의',
  REFUND_POLICY: '환불정책',
  LBS_TERMS: '위치기반서비스 이용약관',
  LOCATION_INFO_CONSENT: '위치정보 수집 동의',
  CHILD_SAFETY_POLICY: '아동 안전 정책',
};

const FIVE_AXIS_TYPES: PolicyDocumentType[] = [
  'PRIVACY_POLICY',
  'DATA_COLLECTION_CONSENT',
  'SENSITIVE_INFO_CONSENT',
  'THIRD_PARTY_PROVISION',
];
const ADVERSE_TYPES: PolicyDocumentType[] = ['TERMS_OF_SERVICE', 'REFUND_POLICY'];
const LOCATION_TYPES: PolicyDocumentType[] = ['LBS_TERMS', 'LOCATION_INFO_CONSENT'];

const FIVE_AXIS_FIELDS = [
  ['axisCollectionItems', '수집 항목'],
  ['axisPurpose', '이용 목적'],
  ['axisRetentionPeriod', '보유·이용 기간'],
  ['axisThirdParty', '제3자 제공'],
  ['axisSensitiveInfo', '민감정보 처리'],
] as const;

const MARKETING_FIELDS = [
  ['marketingMediaExpanded', '수신 매체 확대 (문자/이메일/앱푸시 등)'],
  ['marketingAdTypeExpanded', '광고 유형 확대'],
  ['marketingNightExpanded', '야간 광고 수신 확대'],
] as const;

const DEFAULT_VALUES: PolicyDocumentFormValues = {
  documentType: 'TERMS_OF_SERVICE',
  version: '',
  diffSummary: '',
  changeReason: '',
  contentUrl: '',
  noticeStartedAt: '',
  effectiveAt: '',
  noticeVisibleUntil: '',
  isMandatory: false,
  axisCollectionItems: false,
  axisPurpose: false,
  axisRetentionPeriod: false,
  axisThirdParty: false,
  axisSensitiveInfo: false,
  adverseOrMaterial: false,
  marketingMediaExpanded: false,
  marketingAdTypeExpanded: false,
  marketingNightExpanded: false,
  locationScopeExpanded: false,
  reconsentOverride: false,
  reconsentOverrideReason: '',
  privacyPolicyDisclosureConfirmed: false,
  minimalCollectionConfirmed: false,
};

function toIsoString(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

function buildPayload(
  data: PolicyDocumentFormValues,
  acknowledgeWarnings: boolean,
): RegisterPolicyDocumentRequest {
  const payload: RegisterPolicyDocumentRequest = {
    documentType: data.documentType,
    version: data.version.trim(),
    diffSummary: data.diffSummary.trim(),
    changeReason: data.changeReason.trim(),
    contentUrl: data.contentUrl?.trim() || undefined,
    noticeStartedAt: toIsoString(data.noticeStartedAt),
    effectiveAt: toIsoString(data.effectiveAt),
    noticeVisibleUntil: data.noticeVisibleUntil ? toIsoString(data.noticeVisibleUntil) : undefined,
    isMandatory: data.isMandatory,
  };

  if (acknowledgeWarnings) {
    payload.acknowledgeWarnings = true;
  }

  if (FIVE_AXIS_TYPES.includes(data.documentType)) {
    payload.axisCollectionItems = !!data.axisCollectionItems;
    payload.axisPurpose = !!data.axisPurpose;
    payload.axisRetentionPeriod = !!data.axisRetentionPeriod;
    payload.axisThirdParty = !!data.axisThirdParty;
    payload.axisSensitiveInfo = !!data.axisSensitiveInfo;
  }

  if (ADVERSE_TYPES.includes(data.documentType)) {
    payload.adverseOrMaterial = !!data.adverseOrMaterial;
    payload.reconsentOverride = !!data.reconsentOverride;
    if (data.reconsentOverride) {
      payload.reconsentOverrideReason = data.reconsentOverrideReason?.trim();
    }
  }

  if (data.documentType === 'MARKETING_CONSENT') {
    payload.marketingMediaExpanded = !!data.marketingMediaExpanded;
    payload.marketingAdTypeExpanded = !!data.marketingAdTypeExpanded;
    payload.marketingNightExpanded = !!data.marketingNightExpanded;
  }

  if (LOCATION_TYPES.includes(data.documentType)) {
    payload.locationScopeExpanded = !!data.locationScopeExpanded;
  }

  if (data.documentType === 'SENSITIVE_INFO_CONSENT') {
    payload.privacyPolicyDisclosureConfirmed = !!data.privacyPolicyDisclosureConfirmed;
  }

  if (data.isMandatory) {
    payload.minimalCollectionConfirmed = !!data.minimalCollectionConfirmed;
  }

  return payload;
}

function IssueList({ items }: { items: string[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
      {items.map((item, idx) => (
        <Box component="li" key={idx}>
          <Typography variant="body2">{item}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function PolicyDocumentForm() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();
  const registerMutation = useRegisterPolicyDocument();

  const [blockers, setBlockers] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [decision, setDecision] = useState<PolicyDecision | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    control,
    watch,
    getValues,
    handleFormSubmit,
    formState: { isSubmitting, isDirty },
  } = useAdminForm<PolicyDocumentFormValues>({
    schema: policyDocumentSchema,
    defaultValues: DEFAULT_VALUES,
  });

  useUnsavedGuard(isDirty && !saved, isSubmitting);

  const documentType = watch('documentType');
  const isMandatory = watch('isMandatory');
  const reconsentOverride = watch('reconsentOverride');

  const showFiveAxis = FIVE_AXIS_TYPES.includes(documentType);
  const showAdverse = ADVERSE_TYPES.includes(documentType);
  const showMarketing = documentType === 'MARKETING_CONSENT';
  const showLocation = LOCATION_TYPES.includes(documentType);
  const showPrivacyDisclosure = documentType === 'SENSITIVE_INFO_CONSENT';

  const submit = async (data: PolicyDocumentFormValues, acknowledgeWarnings: boolean) => {
    setBlockers([]);
    try {
      const payload = buildPayload(data, acknowledgeWarnings);
      const result = await registerMutation.mutateAsync(payload);
      setDecision(result.decision);

      if (result.saved) {
        setWarnings([]);
        setSaved(true);
        toast.success(
          `정책 문서가 등록되었습니다. (공지 트랙: ${result.decision.noticeTrack}, 재동의 필요: ${
            result.decision.requiresReconsent ? '예' : '아니오'
          })`,
        );
        router.push('/admin/policy-documents');
        return;
      }

      // saved === false: 200 응답이지만 blockers 또는 warnings로 인해 저장되지 않음
      if (result.blockers.length > 0) {
        setBlockers(result.blockers);
        setWarnings(result.warnings ?? []);
        toast.error(result.message || '등록할 수 없습니다. 아래 항목을 확인해주세요.');
        return;
      }

      setWarnings(result.warnings ?? []);
      toast.warning(result.message || '경고 사항을 확인한 후 다시 등록해주세요.');
    } catch (err) {
      toast.error(getAdminErrorMessage(err, '등록에 실패했습니다.'));
    }
  };

  const onSubmit = handleFormSubmit((data) => submit(data, false));

  const handleAcknowledgeSubmit = async () => {
    await submit(getValues(), true);
  };

  const handleCancel = async () => {
    if (isDirty && !saved) {
      const ok = await confirmAction({
        title: '작성 취소',
        message: '작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?',
      });
      if (!ok) return;
    }
    router.push('/admin/policy-documents');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mr: 2 }}>
          목록으로
        </Button>
        <Typography variant="h5" fontWeight="bold">
          정책 개정 등록
        </Typography>
      </Box>

      {blockers.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>등록할 수 없습니다</AlertTitle>
          <IssueList items={blockers} />
          {warnings.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                추가 경고 사항
              </Typography>
              <IssueList items={warnings} />
            </>
          )}
        </Alert>
      )}

      {blockers.length === 0 && warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>확인이 필요한 경고</AlertTitle>
          <IssueList items={warnings} />
          <Button
            variant="outlined"
            color="warning"
            size="small"
            sx={{ mt: 1 }}
            onClick={handleAcknowledgeSubmit}
            disabled={isSubmitting}
          >
            경고 확인하고 등록
          </Button>
        </Alert>
      )}

      {decision && blockers.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          공지 트랙: {decision.noticeTrack} · 재동의 필요: {decision.requiresReconsent ? '예' : '아니오'}
          {decision.reconsentAxes.length > 0 && ` · 재동의 축: ${decision.reconsentAxes.join(', ')}`}
          {decision.needsLegalReview && ' · 법무 검토 필요'}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          기본 정보
        </Typography>

        <Controller
          name="documentType"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>문서 종류</InputLabel>
              <Select {...field} label="문서 종류">
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />

        <Controller
          name="version"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              label="버전"
              placeholder="예: 2026.07.1"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              sx={{ mb: 2 }}
              required
            />
          )}
        />

        <Controller
          name="diffSummary"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={4}
              label="신구대조 (변경 전/후 비교)"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              sx={{ mb: 2 }}
              required
            />
          )}
        />

        <Controller
          name="changeReason"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={3}
              label="변경사유"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              sx={{ mb: 2 }}
              required
            />
          )}
        />

        <Controller
          name="contentUrl"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              fullWidth
              label="전문 URL (선택)"
              placeholder="https://..."
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          공지·시행 일정
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Controller
            name="noticeStartedAt"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                type="datetime-local"
                label="공지 시작일"
                InputLabelProps={{ shrink: true }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                required
              />
            )}
          />
          <Controller
            name="effectiveAt"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                type="datetime-local"
                label="시행일"
                InputLabelProps={{ shrink: true }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                required
              />
            )}
          />
        </Box>

        <Controller
          name="noticeVisibleUntil"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              fullWidth
              type="datetime-local"
              label="공지 노출 종료일 (선택)"
              InputLabelProps={{ shrink: true }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          필수 여부
        </Typography>
        <Controller
          name="isMandatory"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
              label="필수 동의 항목"
            />
          )}
        />

        {isMandatory && (
          <>
            <Divider sx={{ my: 2 }} />
            <Controller
              name="minimalCollectionConfirmed"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label="최소수집 원칙을 확인했습니다."
                />
              )}
            />
          </>
        )}
      </Paper>

      {showFiveAxis && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            5축 변경 체크리스트
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            이번 개정에서 변경된 항목을 모두 선택해주세요.
          </Typography>
          {FIVE_AXIS_FIELDS.map(([name, label]) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label={label}
                  sx={{ display: 'block' }}
                />
              )}
            />
          ))}

          {showPrivacyDisclosure && (
            <>
              <Divider sx={{ my: 2 }} />
              <Controller
                name="privacyPolicyDisclosureConfirmed"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                    }
                    label="개인정보처리방침에 §23③ 반영 여부를 확인했습니다."
                  />
                )}
              />
            </>
          )}
        </Paper>
      )}

      {showAdverse && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            불리·중대 변경 여부
          </Typography>
          <Controller
            name="adverseOrMaterial"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                }
                label="이용자에게 불리하거나 중대한 변경입니다."
              />
            )}
          />

          <Divider sx={{ my: 2 }} />

          <Controller
            name="reconsentOverride"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                }
                label="재동의 예외 처리 (재동의를 받지 않고 진행)"
              />
            )}
          />

          {reconsentOverride && (
            <Controller
              name="reconsentOverrideReason"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  multiline
                  rows={2}
                  label="재동의 예외 사유"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mt: 1 }}
                  required
                />
              )}
            />
          )}
        </Paper>
      )}

      {showMarketing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            마케팅 수신동의 확대 체크리스트
          </Typography>
          {MARKETING_FIELDS.map(([name, label]) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label={label}
                  sx={{ display: 'block' }}
                />
              )}
            />
          ))}
        </Paper>
      )}

      {showLocation && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            위치 정보 범위 체크리스트
          </Typography>
          <Controller
            name="locationScopeExpanded"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                }
                label="위치 정보 수집·이용 범위가 확대되었습니다."
              />
            )}
          />
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="outlined" onClick={handleCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '등록 중...' : '등록'}
        </Button>
      </Box>
    </Box>
  );
}
