'use client';

import { IconButton } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AdminService from '@/app/services/admin';

interface Props {
  kind: 'blog' | 'card-news' | 'university';
  slugOrId: string;
  country?: 'kr' | 'jp';
}

export function ExternalPageButton({ kind, slugOrId, country = 'kr' }: Props) {
  const url = `/api/admin-proxy${AdminService.seo.getWebPageUrl(kind, slugOrId, country)}`;
  return (
    <IconButton
      size="small"
      component="a"
      href={url}
      target="_blank"
      rel="noopener"
      title="검색엔진용 페이지"
    >
      <OpenInNewIcon fontSize="small" />
    </IconButton>
  );
}
