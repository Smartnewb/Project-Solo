'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SendIcon from '@mui/icons-material/Send';
import {
  usePolicyDocumentList,
  usePolicyConsentProgress,
  usePublishPolicyDocument,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import type { PolicyDocumentStatus, PolicyDocumentType } from '@/types/admin';

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

const STATUS_LABELS: Record<PolicyDocumentStatus, string> = {
  DRAFT: '초안',
  SCHEDULED: '공지 예정',
  NOTICE_ACTIVE: '공지 중',
  EFFECTIVE: '시행 중',
  SUPERSEDED: '대체됨',
};

const STATUS_COLORS: Record<PolicyDocumentStatus, 'default' | 'info' | 'warning' | 'success'> = {
  DRAFT: 'default',
  SCHEDULED: 'info',
  NOTICE_ACTIVE: 'warning',
  EFFECTIVE: 'success',
  SUPERSEDED: 'default',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
}

function ConsentProgressDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = usePolicyConsentProgress(id);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>재동의 진행 현황</DialogTitle>
      <DialogContent>
        {isLoading || !data ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {DOCUMENT_TYPE_LABELS[data.documentType]} · v{data.version}
            </Typography>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">완료율</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(data.completionRate * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={data.completionRate * 100} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">대상 유저</Typography>
              <Typography variant="body2">{data.eligibleUsers.toLocaleString()}명</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">동의</Typography>
              <Typography variant="body2">{data.consented.toLocaleString()}명</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">거부</Typography>
              <Typography variant="body2">{data.declined.toLocaleString()}명</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">대기</Typography>
              <Typography variant="body2">{data.pending.toLocaleString()}명</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PolicyDocumentsPage() {
  const toast = useToast();
  const confirmAction = useConfirm();

  const [statusFilter, setStatusFilter] = useState<PolicyDocumentStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<PolicyDocumentType | ''>('');
  const [progressId, setProgressId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = usePolicyDocumentList({
    status: statusFilter || undefined,
    documentType: typeFilter || undefined,
  });

  const publishMutation = usePublishPolicyDocument();

  const handlePublish = async (id: string, version: string) => {
    const ok = await confirmAction({
      title: '공지 개시',
      message: `버전 ${version} 문서의 공지를 지금 개시하시겠습니까?`,
    });
    if (!ok) return;
    try {
      await publishMutation.mutateAsync(id);
      toast.success('공지가 개시되었습니다.');
    } catch (err: unknown) {
      toast.error(getAdminErrorMessage(err, '공지 개시에 실패했습니다.'));
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          정책 개정 등록
        </Typography>
        <Button component={Link} href="/admin/policy-documents/create" variant="contained" startIcon={<AddIcon />}>
          정책 개정 등록
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>문서 종류</InputLabel>
          <Select
            label="문서 종류"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PolicyDocumentType | '')}
          >
            <MenuItem value="">전체</MenuItem>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>상태</InputLabel>
          <Select
            label="상태"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PolicyDocumentStatus | '')}
          >
            <MenuItem value="">전체</MenuItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>문서 종류</TableCell>
                <TableCell>버전</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">공지 트랙</TableCell>
                <TableCell align="center">재동의 필요</TableCell>
                <TableCell align="center">시행일</TableCell>
                <TableCell align="center">등록일</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      등록된 정책 문서가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>{DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}</TableCell>
                    <TableCell>{doc.version}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={STATUS_LABELS[doc.status] ?? doc.status}
                        size="small"
                        color={STATUS_COLORS[doc.status] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">{doc.noticeTrack}</TableCell>
                    <TableCell align="center">
                      {doc.requiresReconsent ? (
                        <Chip label={doc.reconsentAxes.join(', ') || '필요'} size="small" color="error" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">{formatDate(doc.effectiveAt)}</TableCell>
                    <TableCell align="center">{formatDate(doc.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {doc.requiresReconsent && (
                          <IconButton
                            size="small"
                            onClick={() => setProgressId(doc.id)}
                            title="재동의 진행 현황"
                          >
                            <FactCheckIcon fontSize="small" />
                          </IconButton>
                        )}
                        {(doc.status === 'DRAFT' || doc.status === 'SCHEDULED') && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handlePublish(doc.id, doc.version)}
                            title="공지 개시"
                            disabled={publishMutation.isPending}
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {progressId && <ConsentProgressDialog id={progressId} onClose={() => setProgressId(null)} />}
    </Box>
  );
}
