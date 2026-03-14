'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Button } from '@/shared/ui';
import { useAuth } from '@/contexts/AuthContext';
import { scheduledMatchingService } from '../service';
import type { Country, ScheduledMatchingConfig, CreateScheduledMatchingConfigRequest, UpdateScheduledMatchingConfigRequest } from '../types';
import { parseCronToHumanReadable, CRON_PRESETS, TIMEZONE_OPTIONS } from '../utils';

export default function ScheduleConfig() {
  const { user } = useAuth();
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
    } catch (err) {
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
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
          lastModifiedBy: user?.email || undefined,
        };
        await scheduledMatchingService.updateConfig(selectedCountry, updateData);
        setSuccess('설정이 수정되었습니다.');
      } else {
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
    } catch (err) {
      setError('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = (cronValue: string) => {
    setFormData((prev) => ({ ...prev, cronExpression: cronValue }));
  };

  const currentConfig = configs.find((c) => c.country === selectedCountry);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        스케줄 설정
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>국가 선택</InputLabel>
          <Select
            value={selectedCountry}
            label="국가 선택"
            onChange={(e) => setSelectedCountry(e.target.value as Country)}
          >
            <MenuItem value="KR">🇰🇷 한국</MenuItem>
            <MenuItem value="JP">🇯🇵 일본</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            기본 설정
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
              />
            }
            label={formData.isEnabled ? '활성화' : '비활성화'}
            sx={{ mb: 2, display: 'block' }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              크론 스케줄
            </Typography>
            <TextField
              fullWidth
              value={formData.cronExpression}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, cronExpression: e.target.value }))
              }
              placeholder="0 0 * * 4,0"
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="primary.main" sx={{ mb: 1 }}>
              💡 {parseCronToHumanReadable(formData.cronExpression)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {CRON_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={formData.cronExpression === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetSelect(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </Box>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>타임존</InputLabel>
            <Select
              value={formData.timezone}
              label="타임존"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, timezone: e.target.value }))
              }
              size="small"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <MenuItem key={tz.value} value={tz.value}>
                  {tz.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between"
          >
            <span>고급 설정 (배치 파라미터)</span>
            {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Button>

          <Collapse in={showAdvanced}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
              <TextField
                fullWidth
                type="number"
                label="배치 사이즈"
                value={formData.batchSize}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    batchSize: Math.min(50, Math.max(1, parseInt(e.target.value) || 1)),
                  }))
                }
                helperText="동시 처리 사용자 수 (1~50)"
                size="small"
                sx={{ mb: 2 }}
                inputProps={{ min: 1, max: 50 }}
              />

              <TextField
                fullWidth
                type="number"
                label="사용자간 지연 (ms)"
                value={formData.delayBetweenUsersMs}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    delayBetweenUsersMs: Math.min(10000, Math.max(0, parseInt(e.target.value) || 0)),
                  }))
                }
                helperText="각 사용자 처리 사이 대기 시간 (0~10000ms)"
                size="small"
                sx={{ mb: 2 }}
                inputProps={{ min: 0, max: 10000 }}
              />

              <TextField
                fullWidth
                type="number"
                label="최대 재시도 횟수"
                value={formData.maxRetryCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxRetryCount: Math.min(5, Math.max(0, parseInt(e.target.value) || 0)),
                  }))
                }
                helperText="매칭 실패 시 재시도 횟수 (0~5)"
                size="small"
                sx={{ mb: 2 }}
                inputProps={{ min: 0, max: 5 }}
              />

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                매칭 필터 설정
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="로그인 기준일"
                value={formData.loginWindowDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    loginWindowDays: Math.min(365, Math.max(1, parseInt(e.target.value) || 1)),
                  }))
                }
                helperText="최근 N일 이내 로그인한 사용자만 매칭 대상 (1~365)"
                size="small"
                sx={{ mb: 2 }}
                inputProps={{ min: 1, max: 365 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.includeUnknownRank}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, includeUnknownRank: e.target.checked }))
                    }
                  />
                }
                label="UNKNOWN 랭크 포함"
                sx={{ display: 'block' }}
              />
              <Typography variant="caption" color="text.secondary">
                랭크가 UNKNOWN인 사용자도 매칭 대상에 포함
              </Typography>
            </Box>
          </Collapse>
        </Box>

        <TextField
          fullWidth
          label="메모"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="설정에 대한 설명을 입력하세요"
          size="small"
          sx={{ mb: 3 }}
        />

        {currentConfig?.lastModifiedBy && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            마지막 수정: {currentConfig.lastModifiedBy} (
            {currentConfig.updatedAt
              ? new Date(currentConfig.updatedAt).toLocaleString('ko-KR')
              : '-'}
            )
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outline" onClick={fetchConfigs} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
            저장
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
