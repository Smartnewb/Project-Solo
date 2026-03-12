'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

type Country = 'kr' | 'jp';

const countries: { code: Country; flag: string; name: string; description: string }[] = [
  { code: 'kr', flag: '🇰🇷', name: '대한민국', description: '한국 사용자 데이터' },
  { code: 'jp', flag: '🇯🇵', name: '日本', description: '일본 사용자 데이터' },
];

interface AdminCountrySelectorModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminCountrySelectorModal({ open, onClose }: AdminCountrySelectorModalProps) {
  const { session, changeCountry } = useAdminSession();
  const currentCountry = (session?.selectedCountry || 'kr') as Country;

  const handleSelect = async (code: Country) => {
    if (code === currentCountry) {
      onClose();
      return;
    }

    await changeCountry(code);
    onClose();

    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>운영 국가 선택</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          선택한 국가의 데이터만 조회/수정됩니다
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
          {countries.map((c) => {
            const isSelected = currentCountry === c.code;
            const borderColor = isSelected
              ? c.code === 'kr' ? '#3B82F6' : '#EF4444'
              : '#E5E7EB';
            const bgColor = isSelected
              ? c.code === 'kr' ? '#EFF6FF' : '#FEF2F2'
              : 'transparent';
            return (
              <Box
                key={c.code}
                onClick={() => handleSelect(c.code)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2, p: 2,
                  border: `2px solid ${borderColor}`, borderRadius: 2,
                  backgroundColor: bgColor, cursor: 'pointer', transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: c.code === 'kr' ? '#3B82F6' : '#EF4444',
                    backgroundColor: c.code === 'kr' ? '#EFF6FF' : '#FEF2F2',
                  },
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>{c.flag}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={600}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.description}</Typography>
                </Box>
                {isSelected && (
                  <Typography sx={{ color: c.code === 'kr' ? '#3B82F6' : '#EF4444', fontWeight: 700 }}>✓</Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
