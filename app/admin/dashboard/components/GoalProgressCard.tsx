'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Goal, GoalType, GOAL_TYPE_LABELS, GOAL_TYPE_TO_API } from '../types';
import { dashboardService } from '@/app/services/dashboard';

interface GoalProgressCardProps {
  goals: Goal[];
  loading?: boolean;
  onGoalChange?: () => void;
}

interface GoalItemProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

function GoalItem({ goal, onEdit, onDelete }: GoalItemProps) {
  const progressColor = goal.achievementRate >= 100 ? 'success' : goal.achievementRate >= 70 ? 'primary' : 'warning';

  return (
    <Box className="py-3">
      <Box className="flex items-center justify-between mb-1">
        <Typography variant="body2" fontWeight="medium">
          {GOAL_TYPE_LABELS[goal.type]} 목표
        </Typography>
        <Box>
          <IconButton size="small" onClick={() => onEdit(goal)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(goal.id)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box className="flex items-center justify-between mb-1">
        <Typography variant="caption" color="textSecondary">
          {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
          {goal.type === 'REVENUE' ? '원' : '명'}
        </Typography>
        <Typography variant="body2" fontWeight="bold" color={progressColor}>
          {goal.achievementRate.toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(goal.achievementRate, 100)}
        color={progressColor}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

// 폼 데이터 타입 (UI에서 사용)
interface GoalFormData {
  type: GoalType;
  targetValue: number;
  targetMonth: string;
}

export default function GoalProgressCard({ goals, loading, onGoalChange }: GoalProgressCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    type: 'SIGNUP',
    targetValue: 0,
    targetMonth: new Date().toISOString().slice(0, 7),
  });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setFormData({
      type: 'SIGNUP',
      targetValue: 0,
      targetMonth: new Date().toISOString().slice(0, 7),
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      targetValue: goal.targetValue,
      targetMonth: goal.targetMonth,
    });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (editingGoal) {
        await dashboardService.updateGoal(editingGoal.id, { targetValue: formData.targetValue });
      } else {
        // UI 타입을 API 타입으로 변환하여 전송
        const requestData = {
          type: GOAL_TYPE_TO_API[formData.type],
          targetValue: formData.targetValue,
          targetMonth: formData.targetMonth,
        };
        console.log('목표 생성 요청 데이터:', requestData);
        await dashboardService.createGoal(requestData);
      }
      handleClose();
      onGoalChange?.();
    } catch (error) {
      console.error('목표 저장 실패:', error);
      alert('목표 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await dashboardService.deleteGoal(id);
      onGoalChange?.();
    } catch (error) {
      console.error('목표 삭제 실패:', error);
      alert('목표 삭제에 실패했습니다.');
    }
  };

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box className="flex items-center justify-between mb-2">
            <Typography variant="h6" fontWeight="bold" color="secondary">
              월간 목표
            </Typography>
            <IconButton size="small" onClick={handleOpenCreate} color="primary">
              <AddIcon />
            </IconButton>
          </Box>

          {loading ? (
            <Box>
              <Skeleton height={60} />
              <Skeleton height={60} />
            </Box>
          ) : goals.length === 0 ? (
            <Box className="py-8 text-center">
              <Typography variant="body2" color="textSecondary">
                설정된 목표가 없습니다.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ mt: 2 }}
              >
                목표 추가
              </Button>
            </Box>
          ) : (
            <Box className="divide-y divide-gray-100">
              {goals.map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 목표 생성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editingGoal ? '목표 수정' : '새 목표 추가'}</DialogTitle>
        <DialogContent>
          <Box className="space-y-4 pt-2">
            <FormControl fullWidth disabled={!!editingGoal}>
              <InputLabel>목표 유형</InputLabel>
              <Select
                value={formData.type}
                label="목표 유형"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as GoalType })}
              >
                <MenuItem value="SIGNUP">가입자 수</MenuItem>
                <MenuItem value="REVENUE">매출</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="목표 값"
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
              helperText={formData.type === 'REVENUE' ? '원 단위로 입력' : '명 단위로 입력'}
            />

            <TextField
              fullWidth
              label="목표 월"
              type="month"
              value={formData.targetMonth}
              onChange={(e) => setFormData({ ...formData, targetMonth: e.target.value })}
              disabled={!!editingGoal}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || formData.targetValue <= 0}
          >
            {submitting ? '저장 중...' : editingGoal ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
