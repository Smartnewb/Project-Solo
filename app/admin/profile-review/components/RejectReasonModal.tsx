import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';

interface RejectReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (category: string, reason: string) => void;
}

const REJECTION_CATEGORIES = [
  { value: 'INAPPROPRIATE_PROFILE_IMAGE', label: '부적절한 프로필 이미지' },
  { value: 'FAKE_PROFILE', label: '허위 프로필' },
  { value: 'INAPPROPRIATE_BIO', label: '부적절한 자기소개' },
  { value: 'INCOMPLETE_PROFILE', label: '프로필 미완성' },
  { value: 'DUPLICATE_ACCOUNT', label: '중복 계정' },
  { value: 'OTHER', label: '기타' }
];

const PRESET_REASONS: Record<string, string[]> = {
  'INAPPROPRIATE_PROFILE_IMAGE': [
    '얼굴 식별 불가',
    '부적절한 노출',
    '도용 의심',
    '화질 불량',
    '동물 사진',
    '동일 사진'
  ],
  'FAKE_PROFILE': [
    '연예인/유명인 사진',
    '타인 사진 도용',
    '허위 정보'
  ],
  'INAPPROPRIATE_BIO': [
    '부적절한 내용 포함',
    '광고성 내용',
    '욕설 포함'
  ],
  'INCOMPLETE_PROFILE': [
    '필수 정보 미입력',
    '프로필 사진 부족'
  ],
  'DUPLICATE_ACCOUNT': [
    '이미 가입된 계정 존재'
  ],
  'OTHER': []
};

export default function RejectReasonModal({ open, onClose, onConfirm }: RejectReasonModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedReason(null);
    setCustomReason('');
  };

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setCustomReason('');
  };

  const handleTemplateSelect = (category: string, reason: string) => {
    setSelectedCategory(category);
    setSelectedReason(reason);
    setCustomReason('');
  };

  const handleConfirm = () => {
    if (!selectedCategory) {
      alert('거절 카테고리를 선택해주세요.');
      return;
    }

    let finalReason = '';

    if (selectedCategory === 'OTHER' || PRESET_REASONS[selectedCategory].length === 0) {
      finalReason = customReason;
    } else {
      finalReason = selectedReason || customReason;
    }

    if (!finalReason || finalReason.trim() === '') {
      alert('거절 사유를 선택하거나 입력해주세요.');
      return;
    }

    onConfirm(selectedCategory, finalReason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedCategory('');
    setSelectedReason(null);
    setCustomReason('');
    onClose();
  };

  const currentPresetReasons = selectedCategory ? PRESET_REASONS[selectedCategory] || [] : [];

  const commonTemplates = [
    { category: 'INAPPROPRIATE_PROFILE_IMAGE', reason: '얼굴 식별 불가', label: '얼굴 식별 불가' },
    { category: 'INAPPROPRIATE_PROFILE_IMAGE', reason: '화질 불량', label: '화질 불량' },
    { category: 'INAPPROPRIATE_PROFILE_IMAGE', reason: '동물 사진', label: '동물 사진' },
    { category: 'INAPPROPRIATE_PROFILE_IMAGE', reason: '동일 사진', label: '동일 사진' },
    { category: 'FAKE_PROFILE', reason: '타인 사진 도용', label: '사진 도용' },
    { category: 'INCOMPLETE_PROFILE', reason: '필수 정보 미입력', label: '정보 미입력' },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          반려 사유 선택
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          회원에게 전달될 반려 카테고리와 사유를 선택해주세요.
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* 빠른 템플릿 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'primary.main' }}>
            ⚡ 빠른 선택
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {commonTemplates.map((template, index) => (
              <Chip
                key={index}
                label={template.label}
                size="small"
                onClick={() => handleTemplateSelect(template.category, template.reason)}
                color={selectedCategory === template.category && selectedReason === template.reason ? 'primary' : 'default'}
                sx={{
                  cursor: 'pointer',
                  fontWeight: selectedCategory === template.category && selectedReason === template.reason ? 600 : 400,
                  '&:hover': {
                    backgroundColor: selectedCategory === template.category && selectedReason === template.reason ? undefined : '#e3f2fd'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">
            또는 직접 선택
          </Typography>
        </Divider>

        {/* 카테고리 선택 */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>반려 카테고리</InputLabel>
          <Select
            value={selectedCategory}
            label="반려 카테고리"
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {REJECTION_CATEGORIES.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 프리셋 사유 선택 */}
        {selectedCategory && currentPresetReasons.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              세부 사유 선택
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {currentPresetReasons.map((reason) => (
                <Chip
                  key={reason}
                  label={reason}
                  onClick={() => handleReasonSelect(reason)}
                  color={selectedReason === reason ? 'primary' : 'default'}
                  variant={selectedReason === reason ? 'filled' : 'outlined'}
                  sx={{
                    height: 'auto',
                    py: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: selectedReason === reason ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: selectedReason === reason ? undefined : '#f5f5f5'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 직접 입력 */}
        {selectedCategory && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {currentPresetReasons.length > 0 ? '또는 직접 입력' : '반려 사유 입력'}
            </Typography>
            <Box
              component="textarea"
              value={customReason}
              onChange={(e: any) => setCustomReason(e.target.value)}
              placeholder="반려 사유를 자세히 입력해주세요..."
              sx={{
                width: '100%',
                minHeight: 100,
                p: 1.5,
                borderRadius: 1,
                border: '1px solid #ddd',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                '&:focus': {
                  outline: 'none',
                  borderColor: '#1976d2'
                }
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          취소
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          반려하기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
