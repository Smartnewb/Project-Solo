'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Alert,
  Card,
  CardActionArea,
} from '@mui/material';
import { ExpandMore, Send, ContentCopy } from '@mui/icons-material';
import {
  QA_CATEGORIES,
  LEVEL_META,
  type QaQuestion,
  type GradeLevel,
} from './question-set';

interface Source {
  question: string;
  answer: string;
  similarity: number;
}
interface PlaygroundResult {
  answer: string;
  confidence: number;
  domain: string;
  sources: Source[];
}
interface RunRecord {
  question: string;
  language: 'ko' | 'ja';
  expected?: string;
  level?: GradeLevel;
  result: PlaygroundResult;
  ms: number;
}

function confidenceColor(c: number): string {
  if (c >= 0.7) return '#16a34a';
  if (c >= 0.5) return '#ca8a04';
  return '#dc2626';
}

export default function PlaygroundClient() {
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState<'ko' | 'ja'>('ko');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<RunRecord | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [presetMeta, setPresetMeta] = useState<{ expected: string; level: GradeLevel } | null>(null);

  const pickPreset = useCallback((q: QaQuestion) => {
    setQuestion(q.text);
    setPresetMeta({ expected: q.expected, level: q.level });
    setError(null);
  }, []);

  const run = useCallback(async () => {
    const msg = question.trim();
    if (!msg || loading) return;
    setLoading(true);
    setError(null);
    const startedAt = performance.now();
    try {
      const res = await fetch('/api/admin/cs-playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `요청 실패 (HTTP ${res.status})`);
        return;
      }
      const record: RunRecord = {
        question: msg,
        language,
        expected: presetMeta?.expected,
        level: presetMeta?.level,
        result: data as PlaygroundResult,
        ms: Math.round(performance.now() - startedAt),
      };
      setCurrent(record);
      setHistory((prev) => [record, ...prev].slice(0, 30));
    } catch (e) {
      setError(e instanceof Error ? e.message : '네트워크 오류');
    } finally {
      setLoading(false);
    }
  }, [question, language, loading, presetMeta]);

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          CS Playground
        </Typography>
        <Typography variant="body2" color="text.secondary">
          openclaw 답변을 세션 생성 없이 미리보기·검수합니다. 좌측 질문셋을 누르면 입력칸에 채워지고
          정답 기준이 함께 표시됩니다.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
        {/* 좌측: 질문셋 카드 — 클릭 즉시 입력칸 채움 */}
        <Paper
          variant="outlined"
          sx={{ width: 400, flexShrink: 0, overflow: 'auto', p: 1.5 }}
        >
          <Typography variant="subtitle2" sx={{ px: 0.5, pb: 1 }} color="text.secondary">
            실 유저 질문셋 (30) · 카드 클릭 → 입력
          </Typography>
          <Stack spacing={2}>
            {QA_CATEGORIES.map((cat) => (
              <Box key={cat.label}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ px: 0.5 }}>
                  {cat.label}
                </Typography>
                <Stack spacing={1} sx={{ mt: 0.75 }}>
                  {cat.questions.map((q) => {
                    const selected = question.trim() === q.text;
                    return (
                      <Card
                        key={q.id}
                        variant="outlined"
                        sx={{
                          borderColor: selected ? 'primary.main' : 'divider',
                          borderLeft: `3px solid ${LEVEL_META[q.level].color}`,
                          bgcolor: selected ? 'action.selected' : 'background.paper',
                        }}
                      >
                        <CardActionArea onClick={() => pickPreset(q)} sx={{ px: 1.5, py: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Tooltip title={LEVEL_META[q.level].label}>
                              <span style={{ fontSize: 14, lineHeight: '20px' }}>
                                {LEVEL_META[q.level].emoji}
                              </span>
                            </Tooltip>
                            <Typography variant="body2">{q.text}</Typography>
                          </Stack>
                        </CardActionArea>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* 우측: 입력 + 답변 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto' }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={language}
                  onChange={(_, v) => v && setLanguage(v)}
                >
                  <ToggleButton value="ko">한국어 (KR)</ToggleButton>
                  <ToggleButton value="ja">日本語 (JP)</ToggleButton>
                </ToggleButtonGroup>
                {presetMeta && (
                  <Chip
                    size="small"
                    label={`${LEVEL_META[presetMeta.level].emoji} ${LEVEL_META[presetMeta.level].label}`}
                    sx={{ bgcolor: 'transparent', border: `1px solid ${LEVEL_META[presetMeta.level].color}`, color: LEVEL_META[presetMeta.level].color }}
                  />
                )}
              </Stack>
              <TextField
                multiline
                minRows={2}
                fullWidth
                placeholder="CS 질문을 입력하거나 좌측 질문셋을 선택하세요."
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setPresetMeta(null);
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run();
                }}
              />
              {presetMeta && (
                <Alert severity="info" sx={{ py: 0 }}>
                  <strong>정답 기준:</strong> {presetMeta.expected}
                </Alert>
              )}
              <Box>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send />}
                  disabled={loading || !question.trim()}
                  onClick={run}
                >
                  {loading ? '답변 생성 중… (~20-30s)' : 'openclaw 답변 받기  (⌘/Ctrl+Enter)'}
                </Button>
              </Box>
            </Stack>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}

          {current && <AnswerCard record={current} />}

          {history.length > 1 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                이전 검수 ({history.length - 1})
              </Typography>
              <Stack spacing={1}>
                {history.slice(1).map((r, i) => (
                  <AnswerCard key={i} record={r} compact />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function AnswerCard({ record, compact }: { record: RunRecord; compact?: boolean }) {
  const { question, result, expected, level, ms, language } = record;
  const copyAnswer = () => {
    void navigator.clipboard?.writeText(result.answer);
  };
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip size="small" label={language.toUpperCase()} />
          <Chip
            size="small"
            label={`confidence ${result.confidence.toFixed(3)}`}
            sx={{ color: '#fff', bgcolor: confidenceColor(result.confidence) }}
          />
          <Chip size="small" variant="outlined" label={`domain: ${result.domain}`} />
          <Chip size="small" variant="outlined" label={`${ms}ms`} />
          {result.confidence < 0.5 && (
            <Chip size="small" color="warning" label="에스컬레이션 (conf<0.5)" />
          )}
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary">
            질문
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {question}
          </Typography>
        </Box>

        {expected && (
          <Alert severity={level === 'red' ? 'warning' : 'info'} sx={{ py: 0 }}>
            <strong>{level ? LEVEL_META[level].emoji : ''} 정답 기준:</strong> {expected}
          </Alert>
        )}

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              openclaw 답변
            </Typography>
            <Button size="small" startIcon={<ContentCopy sx={{ fontSize: 14 }} />} onClick={copyAnswer}>
              복사
            </Button>
          </Stack>
          <Typography
            variant="body1"
            sx={{ whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}
          >
            {result.answer || '(빈 답변 — 생성 실패 또는 에스컬레이션)'}
          </Typography>
        </Box>

        {!compact && result.sources?.length > 0 && (
          <Accordion disableGutters elevation={0}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
              <Typography variant="caption" color="text.secondary">
                검색 근거 {result.sources.length}건 (similarity 순)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              <Stack spacing={1}>
                {result.sources.map((s, i) => (
                  <Box key={i} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={s.similarity.toFixed(3)} />
                      <Typography variant="body2" fontWeight={600}>
                        {s.question}
                      </Typography>
                    </Stack>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {s.answer}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </Stack>
    </Paper>
  );
}
