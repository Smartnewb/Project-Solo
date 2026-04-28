'use client';

import { Accordion, AccordionSummary, AccordionDetails, Alert, Chip, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ExcludedUser, ExclusionReason } from '@/app/services/sms';

const REASON_LABELS: Record<ExclusionReason, string> = {
  NO_CONSENT: '마케팅 수신 미동의',
  NO_PHONE: '휴대폰 미등록',
  BOTH: '동의/휴대폰 모두 누락',
};

export function ExcludedUsersCard({ excluded }: { excluded: ExcludedUser[] }) {
  if (!excluded.length) return null;
  const counts = excluded.reduce<Record<ExclusionReason, number>>(
    (acc, u) => {
      acc[u.reason] = (acc[u.reason] ?? 0) + 1;
      return acc;
    },
    {} as Record<ExclusionReason, number>,
  );
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <Typography variant="subtitle2">발송 제외 {excluded.length}명</Typography>
      <Box sx={{ display: 'flex', gap: 1, my: 1, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([reason, count]) => (
          <Chip
            key={reason}
            label={`${REASON_LABELS[reason as ExclusionReason]} ${count}`}
            size="small"
          />
        ))}
      </Box>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>제외 유저 상세</AccordionSummary>
        <AccordionDetails>
          {excluded.map((u) => (
            <Typography key={u.userId} variant="body2" sx={{ py: 0.5 }}>
              {u.name ?? '(이름 없음)'} · {u.phoneNumber ?? '(번호 없음)'} — {REASON_LABELS[u.reason]}
            </Typography>
          ))}
        </AccordionDetails>
      </Accordion>
    </Alert>
  );
}
