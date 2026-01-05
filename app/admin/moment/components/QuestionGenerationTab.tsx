'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AdminService from '@/app/services/admin';
import type {
  Big5Dimension,
  DimensionOrAuto,
  QuestionCandidate,
  DimensionDistribution,
  GenerateQuestionsResponse,
} from '@/types/moment';

const DIMENSION_LABELS: Record<Big5Dimension, string> = {
  openness: '개방성 (Openness)',
  conscientiousness: '성실성 (Conscientiousness)',
  extraversion: '외향성 (Extraversion)',
  agreeableness: '우호성 (Agreeableness)',
  neuroticism: '신경성 (Neuroticism)',
};

const DEFAULT_DISTRIBUTION: DimensionDistribution = {
  openness: 40,
  conscientiousness: 15,
  extraversion: 15,
  agreeableness: 15,
  neuroticism: 15,
};

export default function QuestionGenerationTab() {
  const [theme, setTheme] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [dimension, setDimension] = useState<DimensionOrAuto>('auto');
  const [count, setCount] = useState(10);
  const [useCustomDistribution, setUseCustomDistribution] = useState(false);
  const [distribution, setDistribution] = useState<DimensionDistribution>(DEFAULT_DISTRIBUTION);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<QuestionCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [metadata, setMetadata] = useState<GenerateQuestionsResponse['metadata'] | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAddKeyword = () => {
    const trimmed = keywordsInput.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 10) {
      setKeywords([...keywords, trimmed]);
      setKeywordsInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleDistributionChange = (dim: Big5Dimension, value: number) => {
    setDistribution(prev => ({ ...prev, [dim]: value }));
  };

  const distributionSum = Object.values(distribution).reduce((sum, val) => sum + (val || 0), 0);

  const handleGenerate = async () => {
    if (!theme.trim()) {
      setError('테마를 입력해주세요.');
      return;
    }
    if (keywords.length === 0) {
      setError('최소 1개의 키워드를 입력해주세요.');
      return;
    }
    if (dimension === 'auto' && useCustomDistribution && distributionSum !== 100) {
      setError('분배 비율의 합은 100이어야 합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setCandidates([]);
    setSelectedIds(new Set());
    setMetadata(null);

    try {
      const response = await AdminService.momentQuestions.generate({
        theme: theme.trim(),
        keywords,
        dimension,
        count,
        ...(dimension === 'auto' && useCustomDistribution ? { distribution } : {}),
      });

      setCandidates(response.candidates);
      setMetadata(response.metadata);
      setSelectedIds(new Set(response.candidates.map(c => c.tempId)));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '질문 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (tempId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(tempId)) {
      newSelected.delete(tempId);
    } else {
      newSelected.add(tempId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.tempId)));
    }
  };

  const handleStartEdit = (candidate: QuestionCandidate) => {
    setEditingId(candidate.tempId);
    setEditText(candidate.text);
  };

  const handleSaveEdit = (tempId: string) => {
    setCandidates(prev =>
      prev.map(c => (c.tempId === tempId ? { ...c, text: editText } : c))
    );
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleRemoveCandidate = (tempId: string) => {
    setCandidates(prev => prev.filter(c => c.tempId !== tempId));
    const newSelected = new Set(selectedIds);
    newSelected.delete(tempId);
    setSelectedIds(newSelected);
  };

  const handleSaveQuestions = async () => {
    const selectedCandidates = candidates.filter(c => selectedIds.has(c.tempId));
    if (selectedCandidates.length === 0) {
      setError('저장할 질문을 선택해주세요.');
      return;
    }

    setSaving(true);
    setSaveResult(null);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.bulkCreate({
        questions: selectedCandidates.map(c => ({
          text: c.text,
          dimension: c.dimension,
          type: '선택형',
          options: c.options,
        })),
        metadata: {
          theme,
          keywords,
        },
      });

      if (response.success) {
        setSaveResult({
          success: true,
          message: `${response.created}개 질문이 저장되었습니다.`,
        });
        setCandidates([]);
        setSelectedIds(new Set());
      } else {
        setSaveResult({
          success: false,
          message: `${response.created}개 저장 성공, ${response.failed}개 실패`,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '질문 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          질문 생성 설정
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="테마"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="예: 대학생활, 취업준비, 인간관계"
            fullWidth
          />

          <Box>
            <TextField
              label="키워드 추가"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              placeholder="키워드 입력 후 Enter"
              size="small"
              sx={{ width: 300, mr: 1 }}
            />
            <Button variant="outlined" onClick={handleAddKeyword} disabled={keywords.length >= 10}>
              추가
            </Button>
            <Box sx={{ mt: 1 }}>
              {keywords.map((kw) => (
                <Chip
                  key={kw}
                  label={kw}
                  onDelete={() => handleRemoveKeyword(kw)}
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
              {keywords.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  키워드를 추가해주세요 (최대 10개)
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>차원</InputLabel>
              <Select
                value={dimension}
                label="차원"
                onChange={(e) => setDimension(e.target.value as DimensionOrAuto)}
              >
                <MenuItem value="auto">자동 분배</MenuItem>
                <MenuItem value="openness">개방성 (Openness)</MenuItem>
                <MenuItem value="conscientiousness">성실성 (Conscientiousness)</MenuItem>
                <MenuItem value="extraversion">외향성 (Extraversion)</MenuItem>
                <MenuItem value="agreeableness">우호성 (Agreeableness)</MenuItem>
                <MenuItem value="neuroticism">신경성 (Neuroticism)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="생성 개수"
              type="number"
              value={count}
              onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              inputProps={{ min: 1, max: 50 }}
              sx={{ width: 120 }}
            />
          </Box>

          {dimension === 'auto' && (
            <Accordion expanded={useCustomDistribution} onChange={() => setUseCustomDistribution(!useCustomDistribution)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useCustomDistribution}
                      onChange={(e) => setUseCustomDistribution(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label="커스텀 비율 설정"
                  onClick={(e) => e.stopPropagation()}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  각 차원별 비율을 설정하세요. 합계: {distributionSum}% {distributionSum !== 100 && '(100%가 되어야 합니다)'}
                </Typography>
                {(Object.keys(DIMENSION_LABELS) as Big5Dimension[]).map((dim) => (
                  <Box key={dim} sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      {DIMENSION_LABELS[dim]}: {distribution[dim] || 0}%
                    </Typography>
                    <Slider
                      value={distribution[dim] || 0}
                      onChange={(_, value) => handleDistributionChange(dim, value as number)}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || !theme.trim() || keywords.length === 0}
            sx={{ alignSelf: 'flex-start' }}
          >
            {loading ? <CircularProgress size={24} /> : '질문 생성하기'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {saveResult && (
        <Alert 
          severity={saveResult.success ? 'success' : 'warning'} 
          sx={{ mb: 2 }} 
          onClose={() => setSaveResult(null)}
        >
          {saveResult.message}
        </Alert>
      )}

      {metadata && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            모델: {metadata.model} | 토큰: {metadata.outputTokens} | 비용: ${metadata.cost.toFixed(4)} | 시간: {metadata.processingTimeMs}ms
          </Typography>
        </Paper>
      )}

      {candidates.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              생성된 질문 ({selectedIds.size}/{candidates.length}개 선택)
            </Typography>
            <Box>
              <Button onClick={handleSelectAll} sx={{ mr: 1 }}>
                {selectedIds.size === candidates.length ? '전체 해제' : '전체 선택'}
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveQuestions}
                disabled={saving || selectedIds.size === 0}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                선택한 질문 저장 ({selectedIds.size}개)
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {candidates.map((candidate) => (
              <Card
                key={candidate.tempId}
                variant="outlined"
                sx={{
                  opacity: selectedIds.has(candidate.tempId) ? 1 : 0.6,
                  borderColor: selectedIds.has(candidate.tempId) ? 'primary.main' : 'divider',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Checkbox
                      checked={selectedIds.has(candidate.tempId)}
                      onChange={() => handleToggleSelect(candidate.tempId)}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={DIMENSION_LABELS[candidate.dimension]}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      {editingId === candidate.tempId ? (
                        <TextField
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          fullWidth
                          multiline
                          size="small"
                        />
                      ) : (
                        <Typography variant="body1">{candidate.text}</Typography>
                      )}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          선택지: {candidate.options.map(o => o.text).join(' / ')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  {editingId === candidate.tempId ? (
                    <>
                      <Button size="small" onClick={handleCancelEdit}>취소</Button>
                      <Button size="small" onClick={() => handleSaveEdit(candidate.tempId)}>저장</Button>
                    </>
                  ) : (
                    <>
                      <IconButton size="small" onClick={() => handleStartEdit(candidate)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleRemoveCandidate(candidate.tempId)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </CardActions>
              </Card>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
