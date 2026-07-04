'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import type {
  PixelCampusChoice,
  PixelCampusCut,
  PixelCampusEpisode,
  PixelCampusEpisodePayload,
} from '@/types/admin';
import {
  useCreatePixelCampusEpisode,
  usePixelCampusEpisodes,
  useUpdatePixelCampusEpisode,
  useUploadPixelCampusAsset,
} from '@/app/admin/hooks/use-pixel-campus';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { AXIS_OPTIONS, DIRECTION_LABELS } from '../constants';
import { EpisodePreview } from './EpisodePreview';

const lockedStatuses = new Set(['scheduled', 'published', 'archived']);
const MAX_CUTS = 5;
const MAX_CUT_TEXT_LENGTH = 300;

function emptyCut(speaker: PixelCampusCut['speaker'] = 'miho'): PixelCampusCut {
  return { speaker, text: '' };
}

function createChoice(displayOrder: 1 | 2, choice?: PixelCampusChoice): PixelCampusChoice {
  return {
    label: choice?.label ?? '',
    displayOrder,
    axis: choice?.axis ?? 'initiative',
    direction: choice?.direction ?? (displayOrder === 1 ? 1 : -1),
    weight: choice?.weight ?? 2,
    revealCopy: choice?.revealCopy ?? '',
  };
}

function initialCuts(episode?: PixelCampusEpisode | null): PixelCampusCut[] {
  if (episode?.cuts?.length) {
    return episode.cuts.slice(0, MAX_CUTS).map((cut) => ({
      speaker: cut.speaker,
      text: cut.text ?? '',
    }));
  }

  if (episode?.situationText) {
    return [{ speaker: 'miho', text: episode.situationText }];
  }

  return [emptyCut('miho'), emptyCut('me'), emptyCut('miho')];
}

interface FormState {
  chapterNo: string;
  episodeNo: string;
  title: string;
  sceneImageUrl: string;
  cuts: PixelCampusCut[];
  choices: PixelCampusChoice[];
}

function initialState(episode?: PixelCampusEpisode | null): FormState {
  const sortedChoices = [...(episode?.choices ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    chapterNo: episode?.chapterNo ? String(episode.chapterNo) : '',
    episodeNo: episode?.episodeNo ? String(episode.episodeNo) : '',
    title: episode?.title ?? '',
    sceneImageUrl: episode?.sceneImageUrl ?? '',
    cuts: initialCuts(episode),
    choices: [
      createChoice(1, sortedChoices[0]),
      createChoice(2, sortedChoices[1]),
    ],
  };
}

interface Props {
  episode?: PixelCampusEpisode | null;
  mode: 'create' | 'edit';
}

export function EpisodeForm({ episode, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(episode));
  const [error, setError] = useState<string | null>(null);
  const [autoNumberApplied, setAutoNumberApplied] = useState(false);
  const createEpisode = useCreatePixelCampusEpisode();
  const updateEpisode = useUpdatePixelCampusEpisode();
  const uploadAsset = useUploadPixelCampusAsset();
  const episodesQuery = usePixelCampusEpisodes(
    mode === 'create' ? { status: 'all', page: 1, limit: 100 } : {},
    mode === 'create',
  );
  const isLocked = mode === 'edit' && !!episode && lockedStatuses.has(episode.status);
  const isSaving = createEpisode.isPending || updateEpisode.isPending;

  useEffect(() => {
    if (mode !== 'create' || autoNumberApplied || form.chapterNo || form.episodeNo) return;

    const episodes = episodesQuery.data?.items;
    if (!episodes?.length) return;

    const latestEpisode = [...episodes].sort((a, b) => {
      if (b.chapterNo !== a.chapterNo) return b.chapterNo - a.chapterNo;
      return b.episodeNo - a.episodeNo;
    })[0];

    setForm((prev) => ({
      ...prev,
      chapterNo: prev.chapterNo || String(latestEpisode.chapterNo || 1),
      episodeNo: prev.episodeNo || String((latestEpisode.episodeNo || 0) + 1),
    }));
    setAutoNumberApplied(true);
  }, [
    autoNumberApplied,
    episodesQuery.data?.items,
    form.chapterNo,
    form.episodeNo,
    mode,
  ]);

  const payload = useMemo<PixelCampusEpisodePayload>(() => ({
    chapterNo: Number(form.chapterNo),
    episodeNo: Number(form.episodeNo),
    title: form.title.trim(),
    sceneImageUrl: form.sceneImageUrl.trim() || null,
    cuts: form.cuts
      .map((cut) => ({ speaker: cut.speaker, text: cut.text.trim() }))
      .filter((cut) => cut.text),
    choices: form.choices.map((choice, index) => ({
      ...choice,
      label: choice.label.trim(),
      displayOrder: index + 1,
      revealCopy: choice.revealCopy.trim(),
    })),
  }), [form]);

  const setField = (field: 'chapterNo' | 'episodeNo' | 'title' | 'sceneImageUrl', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setCut = (index: number, value: Partial<PixelCampusCut>) => {
    setForm((prev) => ({
      ...prev,
      cuts: prev.cuts.map((cut, cutIndex) =>
        cutIndex === index ? { ...cut, ...value } : cut,
      ),
    }));
  };

  const addCut = () => {
    setForm((prev) => ({
      ...prev,
      cuts: prev.cuts.length >= MAX_CUTS ? prev.cuts : [...prev.cuts, emptyCut()],
    }));
  };

  const removeCut = (index: number) => {
    setForm((prev) => ({
      ...prev,
      cuts: prev.cuts.length <= 1 ? prev.cuts : prev.cuts.filter((_, cutIndex) => cutIndex !== index),
    }));
  };

  const moveCut = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.cuts.length) return prev;

      const cuts = [...prev.cuts];
      [cuts[index], cuts[nextIndex]] = [cuts[nextIndex], cuts[index]];
      return { ...prev, cuts };
    });
  };

  const setChoice = (index: number, value: Partial<PixelCampusChoice>) => {
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, ...value } : choice,
      ),
    }));
  };

  const validate = (): string | null => {
    if (!payload.chapterNo || payload.chapterNo < 1) return '챕터 번호를 입력해주세요.';
    if (!payload.episodeNo || payload.episodeNo < 1) return '에피소드 번호를 입력해주세요.';
    if (!payload.title) return '제목을 입력해주세요.';
    if (payload.cuts.length < 1) return '컷 대사를 1개 이상 입력해주세요.';
    if (payload.cuts.length > MAX_CUTS) return '컷은 최대 5개까지 입력할 수 있습니다.';
    if (payload.cuts.some((cut) => cut.text.length > MAX_CUT_TEXT_LENGTH)) {
      return '컷 대사는 300자 이하로 입력해주세요.';
    }
    if (payload.choices.length !== 2) return '선택지는 2개여야 합니다.';
    if (payload.choices.some((choice) => !choice.label)) return '두 선택지 라벨을 모두 입력해주세요.';
    if (payload.choices.some((choice) => !choice.revealCopy)) {
      return '두 선택지의 리빌 카피를 모두 입력해주세요.';
    }
    return null;
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      setError('JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.');
      return;
    }

    try {
      const result = await uploadAsset.mutateAsync(file);
      setField('sceneImageUrl', result.url);
    } catch (uploadError) {
      setError(getAdminErrorMessage(uploadError, '이미지 업로드에 실패했습니다.'));
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      if (mode === 'create') {
        await createEpisode.mutateAsync(payload);
      } else if (episode) {
        await updateEpisode.mutateAsync({ id: episode.id, payload });
      }
      router.push('/admin/pixel-campus');
    } catch (saveError) {
      setError(getAdminErrorMessage(saveError, '저장에 실패했습니다.'));
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 420px' }, gap: 3 }}>
      <Box>
        {isLocked && (
          <Alert severity="info" sx={{ mb: 2 }}>
            예약, 게시중, 보관 상태의 에피소드는 수정할 수 없습니다. 상태 변경은 별도 액션을 사용해주세요.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              기본 정보
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="챕터 번호"
                type="number"
                value={form.chapterNo}
                onChange={(event) => setField('chapterNo', event.target.value)}
                disabled={isLocked}
                inputProps={{ min: 1 }}
                fullWidth
              />
              <TextField
                label="에피소드 번호"
                type="number"
                value={form.episodeNo}
                onChange={(event) => setField('episodeNo', event.target.value)}
                disabled={isLocked}
                inputProps={{ min: 1 }}
                helperText={mode === 'create' ? '목록 기준 다음 회차를 자동 입력합니다.' : undefined}
                fullWidth
              />
            </Box>
            <TextField
              label="제목"
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              disabled={isLocked}
              fullWidth
              sx={{ mt: 2 }}
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              장면 이미지
            </Typography>
            <Box
              sx={{
                width: '100%',
                maxWidth: 520,
                aspectRatio: '16 / 10',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: form.sceneImageUrl ? 'divider' : 'warning.main',
                bgcolor: 'grey.100',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              {form.sceneImageUrl ? (
                <Box
                  component="img"
                  src={form.sceneImageUrl}
                  alt="장면 이미지"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  장면 이미지 없음
                </Typography>
              )}
            </Box>
            {!form.sceneImageUrl && (
              <FormHelperText error sx={{ mb: 1 }}>
                게시하려면 장면 이미지가 필요합니다.
              </FormHelperText>
            )}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={uploadAsset.isPending ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                disabled={isLocked || uploadAsset.isPending}
              >
                {form.sceneImageUrl ? '이미지 변경' : '이미지 업로드'}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                />
              </Button>
              {form.sceneImageUrl && (
                <Button
                  variant="outlined"
                  color="error"
                  disabled={isLocked}
                  onClick={() => setField('sceneImageUrl', '')}
                >
                  제거
                </Button>
              )}
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                컷 대사
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={addCut}
                disabled={isLocked || form.cuts.length >= MAX_CUTS}
              >
                컷 추가
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {form.cuts.map((cut, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={cut.speaker}
                      onChange={(_, value: PixelCampusCut['speaker'] | null) => {
                        if (value) setCut(index, { speaker: value });
                      }}
                      disabled={isLocked}
                    >
                      <ToggleButton value="miho">미호</ToggleButton>
                      <ToggleButton value="me">나</ToggleButton>
                    </ToggleButtonGroup>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => moveCut(index, -1)}
                        disabled={isLocked || index === 0}
                        startIcon={<KeyboardArrowUpIcon />}
                      >
                        위
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => moveCut(index, 1)}
                        disabled={isLocked || index === form.cuts.length - 1}
                        startIcon={<KeyboardArrowDownIcon />}
                      >
                        아래
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={() => removeCut(index)}
                        disabled={isLocked || form.cuts.length <= 1}
                        startIcon={<DeleteIcon />}
                      >
                        삭제
                      </Button>
                    </Box>
                  </Box>
                  <TextField
                    label={`컷 ${index + 1}`}
                    value={cut.text}
                    onChange={(event) => setCut(index, { text: event.target.value.slice(0, MAX_CUT_TEXT_LENGTH) })}
                    disabled={isLocked}
                    fullWidth
                    multiline
                    rows={3}
                    helperText={`${cut.text.length}/${MAX_CUT_TEXT_LENGTH}`}
                  />
                </Paper>
              ))}
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              선택지
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {form.choices.map((choice, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    선택지 {index + 1}
                  </Typography>
                  <TextField
                    label="라벨"
                    value={choice.label}
                    onChange={(event) => setChoice(index, { label: event.target.value })}
                    disabled={isLocked}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="리빌 카피"
                    value={choice.revealCopy}
                    onChange={(event) => setChoice(index, { revealCopy: event.target.value })}
                    disabled={isLocked}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Paper>
              ))}
            </Box>

            <Accordion variant="outlined" disableGutters sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">고급 설정</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {form.choices.map((choice, index) => {
                    const directionLabels = DIRECTION_LABELS[choice.axis];

                    return (
                      <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                          선택지 {index + 1} 점수
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                          <FormControl size="small" fullWidth>
                            <InputLabel id={`axis-${index}`}>축</InputLabel>
                            <Select
                              labelId={`axis-${index}`}
                              label="축"
                              value={choice.axis}
                              disabled={isLocked}
                              onChange={(event) => setChoice(index, { axis: event.target.value as PixelCampusChoice['axis'] })}
                            >
                              {AXIS_OPTIONS.map((axis) => (
                                <MenuItem key={axis.value} value={axis.value}>
                                  {axis.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" fullWidth>
                            <InputLabel id={`direction-${index}`}>방향</InputLabel>
                            <Select
                              labelId={`direction-${index}`}
                              label="방향"
                              value={choice.direction}
                              disabled={isLocked}
                              onChange={(event) => setChoice(index, { direction: Number(event.target.value) as -1 | 1 })}
                            >
                              <MenuItem value={1}>+ {directionLabels.positive}</MenuItem>
                              <MenuItem value={-1}>- {directionLabels.negative}</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControl size="small" fullWidth>
                            <InputLabel id={`weight-${index}`}>가중치</InputLabel>
                            <Select
                              labelId={`weight-${index}`}
                              label="가중치"
                              value={choice.weight}
                              disabled={isLocked}
                              onChange={(event) => setChoice(index, { weight: Number(event.target.value) as 1 | 2 | 3 })}
                            >
                              {[1, 2, 3].map((weight) => (
                                <MenuItem key={weight} value={weight}>
                                  {weight}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button onClick={() => router.push('/admin/pixel-campus')} disabled={isSaving}>
            목록
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLocked || isSaving}
          >
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          앱 미리보기
        </Typography>
        <EpisodePreview
          sceneImageUrl={form.sceneImageUrl}
          cuts={form.cuts}
          choices={form.choices}
        />
      </Box>
    </Box>
  );
}
