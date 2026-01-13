import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  CircularProgress,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type {
  UniversityItem,
  CreateUniversityRequest,
  UpdateUniversityRequest,
  RegionMetaItem,
  TypeMetaItem,
  UniversityType,
} from '@/types/admin';

interface UniversityFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editUniversity: UniversityItem | null;
  regions: RegionMetaItem[];
  types: TypeMetaItem[];
}

interface FormData {
  name: string;
  region: string;
  code: string;
  en: string;
  type: UniversityType;
  foundation: string;
  isActive: boolean;
}

export default function UniversityFormDialog({
  open,
  onClose,
  onSubmit,
  editUniversity,
  regions,
  types,
}: UniversityFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [foundations, setFoundations] = useState<TypeMetaItem[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    region: '',
    code: '',
    en: '',
    type: 'UNIVERSITY',
    foundation: '',
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      loadFoundations();
      if (editUniversity) {
        setFormData({
          name: editUniversity.name,
          region: editUniversity.region,
          code: editUniversity.code || '',
          en: editUniversity.en || '',
          type: editUniversity.type,
          foundation: editUniversity.foundation || '',
          isActive: editUniversity.isActive,
        });
      } else {
        setFormData({
          name: '',
          region: '',
          code: '',
          en: '',
          type: 'UNIVERSITY',
          foundation: '',
          isActive: true,
        });
      }
    }
  }, [open, editUniversity]);

  const loadFoundations = async () => {
    try {
      const data = await AdminService.universities.meta.getFoundations();
      setFoundations(data);
    } catch (err) {
      console.error('설립 유형 로드 실패:', err);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.region || !formData.type) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      if (editUniversity) {
        const updateData: UpdateUniversityRequest = {};
        if (formData.name !== editUniversity.name) updateData.name = formData.name;
        if (formData.region !== editUniversity.region) updateData.region = formData.region;
        if (formData.code !== (editUniversity.code || '')) updateData.code = formData.code || undefined;
        if (formData.en !== (editUniversity.en || '')) updateData.en = formData.en || undefined;
        if (formData.type !== editUniversity.type) updateData.type = formData.type;
        if (formData.foundation !== (editUniversity.foundation || ''))
          updateData.foundation = formData.foundation || undefined;
        if (formData.isActive !== editUniversity.isActive) updateData.isActive = formData.isActive;

        await AdminService.universities.update(editUniversity.id, updateData);
      } else {
        const createData: CreateUniversityRequest = {
          name: formData.name,
          region: formData.region,
          type: formData.type,
          isActive: formData.isActive,
        };
        if (formData.code) createData.code = formData.code;
        if (formData.en) createData.en = formData.en;
        if (formData.foundation) createData.foundation = formData.foundation;

        await AdminService.universities.create(createData);
      }

      onSubmit();
    } catch (err: any) {
      alert(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editUniversity ? '대학 수정' : '대학 등록'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="대학명"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="영문명"
            value={formData.en}
            onChange={(e) => handleChange('en', e.target.value)}
            fullWidth
          />

          <TextField
            label="대학 코드"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            fullWidth
            helperText="로고 URL 생성에 사용됩니다"
          />

          <FormControl fullWidth required>
            <InputLabel>지역</InputLabel>
            <Select
              value={formData.region}
              label="지역"
              onChange={(e) => handleChange('region', e.target.value)}
            >
              {regions.map((region) => (
                <MenuItem key={region.code} value={region.code}>
                  {region.nameLocal} ({region.name})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>대학 유형</InputLabel>
            <Select
              value={formData.type}
              label="대학 유형"
              onChange={(e) => handleChange('type', e.target.value as UniversityType)}
            >
              {types.map((type) => (
                <MenuItem key={type.code} value={type.code}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>설립 유형</InputLabel>
            <Select
              value={formData.foundation}
              label="설립 유형"
              onChange={(e) => handleChange('foundation', e.target.value)}
            >
              <MenuItem value="">선택 안 함</MenuItem>
              {foundations.map((foundation) => (
                <MenuItem key={foundation.code} value={foundation.code}>
                  {foundation.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
              />
            }
            label="활성화"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : editUniversity ? '수정' : '등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
