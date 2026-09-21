'use client';

import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSitemapLocCount } from '@/app/admin/hooks/use-seo';
import AdminService from '@/app/services/admin';
import type { SitemapKind } from '@/app/services/admin/seo';

interface SitemapRowConfig {
  kind: SitemapKind;
  label: string;
  country?: 'kr' | 'jp';
}

const ROWS: SitemapRowConfig[] = [
  { kind: 'index', label: 'Sitemap Index' },
  { kind: 'static', label: 'Static' },
  { kind: 'articles', label: 'Articles (KR)', country: 'kr' },
  { kind: 'articles', label: 'Articles (JP)', country: 'jp' },
  { kind: 'cardnews', label: 'CardNews (KR)', country: 'kr' },
  { kind: 'cardnews', label: 'CardNews (JP)', country: 'jp' },
  { kind: 'universities', label: 'Universities (KR)', country: 'kr' },
  { kind: 'universities', label: 'Universities (JP)', country: 'jp' },
];

function SitemapRow({ kind, country, label }: SitemapRowConfig) {
  const url = AdminService.seo.getSitemapUrl(kind, country);
  const { data, isLoading, isError } = useSitemapLocCount(url);
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell>
        <Box component="code" sx={{ fontSize: '0.85em' }}>
          {url}
        </Box>
      </TableCell>
      <TableCell align="center">
        {isLoading ? (
          <CircularProgress size={16} />
        ) : isError ? (
          <Typography variant="caption" color="error">
            오류
          </Typography>
        ) : (
          (data ?? '-')
        )}
      </TableCell>
      <TableCell align="center">
        <Button
          size="small"
          startIcon={<OpenInNewIcon />}
          component="a"
          href={`/api/admin-proxy${url}`}
          target="_blank"
          rel="noopener"
        >
          XML 보기
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function SeoPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        SEO 상태
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>구분</TableCell>
              <TableCell>경로</TableCell>
              <TableCell align="center">loc 수</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ROWS.map((r) => (
              <SitemapRow key={`${r.kind}-${r.country ?? 'global'}`} {...r} />
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 2, display: 'block' }}
      >
        sitemap 캐시는 서버에서 1h(static 24h) 주기로 갱신됩니다. 캐시 무효화 API는 서버 추가 후
        연결 예정.
      </Typography>
    </Box>
  );
}
