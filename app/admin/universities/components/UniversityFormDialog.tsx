import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
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
import { useAdminForm } from '@/app/admin/hooks/forms';
import {
  universitySchema,
  type UniversityFormValues,
} from '@/app/admin/hooks/forms/schemas/university.schema';

interface UniversityFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editUniversity: UniversityItem | null;
  regions: RegionMetaItem[];
  types: TypeMetaItem[];
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

  const { control, handleFormSubmit, reset } = useAdminForm<UniversityFormValues>({
    schema: universitySchema,
    defaultValues: {
      name: '',
      region: '',
      code: '',
      en: '',
      type: 'UNIVERSITY',
      foundation: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      loadFoundations();
      if (editUniversity) {
        reset({
          name: editUniversity.name,
          region: editUniversity.region,
          code: editUniversity.code || '',
          en: editUniversity.en || '',
          type: editUniversity.type,
          foundation: editUniversity.foundation || '',
          isActive: editUniversity.isActive,
        });
      } else {
        reset({
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
    } catch { }
  };

  const onFormSubmit = handleFormSubmit(async (data: UniversityFormValues) => {
    setLoading(true);
    try {
      if (editUniversity) {
        const updateData: UpdateUniversityRequest = {};
        if (data.name !== editUniversity.name) updateData.name = data.name;
        if (data.region !== editUniversity.region) updateData.region = data.region;
        if (data.code !== (editUniversity.code || '')) updateData.code = data.code || undefined;
        if (data.en !== (editUniversity.en || '')) updateData.en = data.en || undefined;
        if (data.type !== editUniversity.type) updateData.type = data.type as UniversityType;
        if (data.foundation !== (editUniversity.foundation || ''))
          updateData.foundation = data.foundation || undefined;
        if (data.isActive !== editUniversity.isActive) updateData.isActive = data.isActive;

        await AdminService.universities.update(editUniversity.id, updateData);
      } else {
        const createData: CreateUniversityRequest = {
          name: data.name,
          region: data.region,
          type: data.type as UniversityType,
          isActive: data.isActive,
        };
        if (data.code) createData.code = data.code;
        if (data.en) createData.en = data.en;
        if (data.foundation) createData.foundation = data.foundation;

        await AdminService.universities.create(createData);
      }

      onSubmit();
    } finally {
      setLoading(false);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editUniversity ? '대학 수정' : '대학 등록'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="대학명"
                fullWidth
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="en"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="영문명"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="code"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="대학 코드"
                fullWidth
                helperText={fieldState.error?.message || '로고 URL 생성에 사용됩니다'}
                error={!!fieldState.error}
              />
            )}
          />

          <Controller
            name="region"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth required error={!!fieldState.error}>
                <InputLabel>지역</InputLabel>
                <Select {...field} label="지역">
                  {regions.map((region) => (
                    <MenuItem key={region.code} value={region.code}>
                      {region.nameLocal} ({region.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth required error={!!fieldState.error}>
                <InputLabel>대학 유형</InputLabel>
                <Select {...field} label="대학 유형">
                  {types.map((type) => (
                    <MenuItem key={type.code} value={type.code}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="foundation"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>설립 유형</InputLabel>
                <Select {...field} label="설립 유형">
                  <MenuItem value="">선택 안 함</MenuItem>
                  {foundations.map((foundation) => (
                    <MenuItem key={foundation.code} value={foundation.code}>
                      {foundation.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label="활성화"
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button onClick={onFormSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : editUniversity ? '수정' : '등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
