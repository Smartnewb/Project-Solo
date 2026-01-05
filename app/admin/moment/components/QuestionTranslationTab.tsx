'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  CircularProgress,
  Alert,
  Pagination,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import PreviewIcon from '@mui/icons-material/Preview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdminService from '@/app/services/admin';
import type {
  Big5Dimension,
  QuestionListItem,
  TranslationPreviewItem,
  TranslatePreviewResponse,
  TranslateExecuteResponse,
} from '@/types/moment';
import { isTranslatePreviewResponse, isTranslateExecuteResponse } from '@/types/moment';

const DIMENSION_LABELS: Record<Big5Dimension, string> = {
  openness: '개방성',
  conscientiousness: '성실성',
  extraversion: '외향성',
  agreeableness: '우호성',
  neuroticism: '신경성',
};

type TranslationStep = 'select' | 'preview' | 'result';

export default function QuestionTranslationTab() {
  const [step, setStep] = useState<TranslationStep>('select');
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewData, setPreviewData] = useState<TranslatePreviewResponse | null>(null);
  const [resultData, setResultData] = useState<TranslateExecuteResponse | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchUntranslatedQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.getList({
        translationStatus: 'kr_only',
        page,
        limit: 15,
        isActive: true,
      });

      setQuestions(response.questions);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '질문 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (step === 'select') {
      fetchUntranslatedQuestions();
    }
  }, [fetchUntranslatedQuestions, step]);

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
  };

  const handlePreview = async () => {
    if (selectedIds.size === 0) {
      setError('번역할 질문을 선택해주세요.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.translate({
        questionIds: Array.from(selectedIds),
        targetSchema: 'jp',
        preview: true,
      });

      if (isTranslatePreviewResponse(response)) {
        setPreviewData(response);
        setStep('preview');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '미리보기 실패');
    } finally {
      setProcessing(false);
    }
  };

  const handleExecuteTranslation = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.translate({
        questionIds: Array.from(selectedIds),
        targetSchema: 'jp',
        preview: false,
      });

      if (isTranslateExecuteResponse(response)) {
        setResultData(response);
        setStep('result');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '번역 실행 실패');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedIds(new Set());
    setPreviewData(null);
    setResultData(null);
    setPage(1);
    fetchUntranslatedQuestions();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <Box>
      <Stepper activeStep={step === 'select' ? 0 : step === 'preview' ? 1 : 2} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>질문 선택</StepLabel>
        </Step>
        <Step>
          <StepLabel>번역 미리보기</StepLabel>
        </Step>
        <Step>
          <StepLabel>완료</StepLabel>
        </Step>
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {step === 'select' && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">
                번역되지 않은 질문: <strong>{totalCount}개</strong>
              </Typography>
              <Button
                variant="contained"
                onClick={handlePreview}
                disabled={selectedIds.size === 0 || processing}
                startIcon={processing ? <CircularProgress size={20} /> : <PreviewIcon />}
              >
                미리보기 ({selectedIds.size}개)
              </Button>
            </Box>
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={questions.length > 0 && selectedIds.size === questions.length}
                          indeterminate={selectedIds.size > 0 && selectedIds.size < questions.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>질문 (한국어)</TableCell>
                      <TableCell align="center" width={100}>차원</TableCell>
                      <TableCell align="center" width={100}>생성일</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary" sx={{ py: 4 }}>
                            번역이 필요한 질문이 없습니다.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((question) => (
                        <TableRow key={question.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedIds.has(question.id)}
                              onChange={() => handleToggleSelect(question.id)}
                            />
                          </TableCell>
                          <TableCell>{question.text}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={DIMENSION_LABELS[question.dimension]}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">{formatDate(question.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {step === 'preview' && previewData && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1">
                  번역 예상: <strong>{previewData.translations.length}개</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  예상 비용: ${previewData.metadata.estimatedCost.toFixed(4)} | 예상 시간: {previewData.metadata.estimatedTimeMs}ms
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={handleReset} disabled={processing}>
                  다시 선택
                </Button>
                <Button
                  variant="contained"
                  onClick={handleExecuteTranslation}
                  disabled={processing}
                  startIcon={processing ? <CircularProgress size={20} /> : <TranslateIcon />}
                >
                  번역 실행
                </Button>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {previewData.translations.map((item, index) => (
              <Card key={item.sourceId} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    #{index + 1}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        한국어 (원본)
                      </Typography>
                      <Typography variant="body1">{item.source.text}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {item.source.options.join(' / ')}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        일본어 (번역)
                      </Typography>
                      <Typography variant="body1">{item.translated.text}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {item.translated.options.join(' / ')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      {step === 'result' && resultData && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: resultData.success ? 'success.main' : 'warning.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            번역 {resultData.success ? '완료' : '부분 완료'}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            성공: {resultData.translated}개 / 실패: {resultData.failed}개
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            실제 비용: ${resultData.metadata.actualCost.toFixed(4)} | 처리 시간: {resultData.metadata.processingTimeMs}ms
          </Typography>

          {resultData.failed > 0 && (
            <Alert severity="warning" sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="body2">실패한 항목:</Typography>
              {resultData.results
                .filter(r => r.status === 'failed')
                .map(r => (
                  <Typography key={r.sourceId} variant="body2">
                    - {r.sourceId}: {r.error}
                  </Typography>
                ))}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={handleReset}
            sx={{ mt: 3 }}
          >
            처음으로
          </Button>
        </Paper>
      )}
    </Box>
  );
}
