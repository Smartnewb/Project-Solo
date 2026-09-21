'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminService from '@/app/services/admin';
import type { UtmLink } from '@/app/services/admin';
import type { UtmRegion } from '@/app/services/admin/utm';
import { useToast } from '@/shared/ui/admin/toast';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import {
	PLACEMENT_OPTIONS,
	PLATFORM_BINDING_OPTIONS,
	SITE_SOURCE_NAME_OPTIONS,
	UTM_CREATIVE_FORMAT_OPTIONS,
	UTM_MARKETING_TACTIC_OPTIONS,
	UTM_SOURCE_PLATFORM_OPTIONS,
} from '../utm-options';

interface UtmLinkListProps {
  refreshKey: number;
}
function inferIosRegion(link: UtmLink): UtmRegion {
  const destination = link.destinationUrl.toLowerCase();
  if (/apps\.apple\.com\/jp(?:\/|$)/.test(destination)) return 'jp';
  if (/apps\.apple\.com\/kr(?:\/|$)/.test(destination)) return 'kr';
  return destination.includes('apps.apple.com') && /(?:^|[_-])jp(?:[_-]|$)/i.test(link.utmCampaign)
    ? 'jp'
    : 'kr';
}

export default function UtmLinkList({ refreshKey }: UtmLinkListProps) {
  const toast = useToast();
  const confirm = useConfirm();

  const [links, setLinks] = useState<UtmLink[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
	  const [search, setSearch] = useState('');
	  const [platformFilter, setPlatformFilter] = useState('');
	  const [campaignFilter, setCampaignFilter] = useState('');
	  const [contentFilter, setContentFilter] = useState('');
	  const [termFilter, setTermFilter] = useState('');
	  const [campaignIdFilter, setCampaignIdFilter] = useState('');
	  const [adsetIdFilter, setAdsetIdFilter] = useState('');
	  const [adGroupIdFilter, setAdGroupIdFilter] = useState('');
	  const [adIdFilter, setAdIdFilter] = useState('');
	  const [creativeIdFilter, setCreativeIdFilter] = useState('');
	  const [page, setPage] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editLink, setEditLink] = useState<UtmLink | null>(null);
  const [editName, setEditName] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTerm, setEditTerm] = useState('');
  const [editUtmId, setEditUtmId] = useState('');
  const [editSourcePlatform, setEditSourcePlatform] = useState('');
  const [editCreativeFormat, setEditCreativeFormat] = useState('');
  const [editMarketingTactic, setEditMarketingTactic] = useState('');
  const [editBindingPlatform, setEditBindingPlatform] = useState<'meta' | 'google_ads'>('meta');
  const [editCampaignId, setEditCampaignId] = useState('');
  const [editAdsetId, setEditAdsetId] = useState('');
	  const [editAdGroupId, setEditAdGroupId] = useState('');
	  const [editAdId, setEditAdId] = useState('');
	  const [editCreativeId, setEditCreativeId] = useState('');
	  const [editPlacement, setEditPlacement] = useState('');
	  const [editSiteSourceName, setEditSiteSourceName] = useState('');
	  const [editRegion, setEditRegion] = useState<UtmRegion>('kr');
	  const [bindingsEdited, setBindingsEdited] = useState(false);
	  const [editSaving, setEditSaving] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
	      const result = await AdminService.utm.getLinks({
	        page: page + 1,
	        search: search || undefined,
	        utmCampaign: campaignFilter || undefined,
	        utmContent: contentFilter || undefined,
	        platform: platformFilter || undefined,
	        utmTerm: termFilter || undefined,
	        campaignId: campaignIdFilter || undefined,
	        adsetId: adsetIdFilter || undefined,
	        adGroupId: adGroupIdFilter || undefined,
	        adId: adIdFilter || undefined,
	        creativeId: creativeIdFilter || undefined,
	      });
      setLinks(result.data);
      setTotal(result.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '링크 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
	  }, [
	    page,
	    search,
	    campaignFilter,
	    contentFilter,
	    platformFilter,
	    termFilter,
	    campaignIdFilter,
	    adsetIdFilter,
	    adGroupIdFilter,
	    adIdFilter,
	    creativeIdFilter,
	  ]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks, refreshKey]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} 복사 완료`);
    } catch {
      toast.error('클립보드 복사에 실패했습니다.');
    }
  };

	  const openEdit = (link: UtmLink) => {
	    setEditLink(link);
	    setEditName(link.name);
	    setEditMemo(link.memo || '');
	    setEditContent(link.utmContent || '');
	    setEditTerm(link.utmTerm || '');
	    setEditUtmId(link.utmId || '');
	    setEditSourcePlatform(link.utmSourcePlatform || '');
	    setEditCreativeFormat(link.utmCreativeFormat || '');
	    setEditMarketingTactic(link.utmMarketingTactic || '');
	    const binding = link.bindings?.[0];
	    setEditBindingPlatform(binding?.platform === 'google_ads' ? 'google_ads' : 'meta');
	    setEditCampaignId(binding?.campaignId || '');
	    setEditAdsetId(binding?.adsetId || '');
	    setEditAdGroupId(binding?.adGroupId || '');
	    setEditAdId(binding?.adId || '');
	    setEditCreativeId(binding?.creativeId || '');
	    setEditPlacement(binding?.placement || '');
	    setEditSiteSourceName(binding?.siteSourceName || '');
	    setEditRegion(link.destinationType === 'appstore_ios' ? inferIosRegion(link) : 'kr');
	    setBindingsEdited(false);
	    setEditOpen(true);
	  };

  const handleEditSave = async () => {
    if (!editLink) return;
    setEditSaving(true);
    try {
	      const data = {
	        name: editName,
	        memo: editMemo || undefined,
	        utmContent: editContent || undefined,
	        utmTerm: editTerm || undefined,
	        utmId: editUtmId || undefined,
	        utmSourcePlatform: editSourcePlatform || undefined,
	        utmCreativeFormat: editCreativeFormat || undefined,
	        utmMarketingTactic: editMarketingTactic || undefined,
	        ...(editLink.destinationType === 'appstore_ios' ? { region: editRegion } : {}),
	        ...(bindingsEdited
	          ? {
	              platformBindings: [
	                {
	                  platform: editBindingPlatform,
	                  campaignId: editCampaignId || undefined,
	                  adsetId: editBindingPlatform === 'meta' ? editAdsetId || undefined : undefined,
	                  adGroupId: editBindingPlatform === 'google_ads' ? editAdGroupId || undefined : undefined,
	                  adId: editAdId || undefined,
	                  creativeId: editCreativeId || undefined,
	                  placement: editPlacement || undefined,
	                  siteSourceName: editSiteSourceName || undefined,
	                },
	              ].filter((binding) => binding.campaignId || binding.adsetId || binding.adGroupId || binding.adId || binding.creativeId || binding.placement || binding.siteSourceName),
	            }
	          : {}),
	      };
	      const updated = await AdminService.utm.updateLink(editLink.id, data);
      setLinks((prev) => prev.map((l) => (l.id === editLink.id ? { ...l, ...updated } : l)));
      setEditOpen(false);
      toast.success('수정되었습니다.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (link: UtmLink) => {
    const confirmed = await confirm({
      title: '링크 삭제',
      message: `"${link.name}" 링크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      severity: 'error',
    });
    if (!confirmed) return;

    try {
      await AdminService.utm.deleteLink(link.id);
      toast.success('삭제되었습니다.');
      fetchLinks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            UTM 링크 목록
          </Typography>
          <TextField
            placeholder="검색 (이름, 캠페인...)"
            size="small"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 280 }}
          />
	          <TextField
	            select
	            label="플랫폼"
            size="small"
            value={platformFilter}
            onChange={(e) => {
              setPlatformFilter(e.target.value);
              setPage(0);
            }}
            sx={{ width: 140 }}
          >
            <MenuItem value="">전체</MenuItem>
	            <MenuItem value="meta">Meta</MenuItem>
	            <MenuItem value="google_ads">Google Ads</MenuItem>
	          </TextField>
	          <TextField
	            label="utm_campaign"
	            size="small"
	            value={campaignFilter}
	            onChange={(e) => {
	              setCampaignFilter(e.target.value);
	              setPage(0);
	            }}
	            sx={{ width: 180 }}
	          />
	          <TextField
	            label="utm_content"
	            size="small"
	            value={contentFilter}
	            onChange={(e) => {
	              setContentFilter(e.target.value);
	              setPage(0);
	            }}
	            sx={{ width: 180 }}
	          />
	          <TextField
	            label="utm_term"
	            size="small"
	            value={termFilter}
            onChange={(e) => {
              setTermFilter(e.target.value);
              setPage(0);
	            }}
	            sx={{ width: 160 }}
	          />
	          <TextField
	            label="campaign_id"
	            size="small"
	            value={campaignIdFilter}
	            onChange={(e) => {
	              setCampaignIdFilter(e.target.value);
	              setPage(0);
	            }}
	            sx={{ width: 170 }}
	          />
	          <TextField
	            label="adset_id"
	            size="small"
	            value={adsetIdFilter}
	            onChange={(e) => {
	              setAdsetIdFilter(e.target.value);
	              setPage(0);
	            }}
	            sx={{ width: 150 }}
	          />
	          <TextField
	            label="ad_group_id"
	            size="small"
	            value={adGroupIdFilter}
	            onChange={(e) => {
	              setAdGroupIdFilter(e.target.value);
	              setPage(0);
	            }}
	            sx={{ width: 160 }}
	          />
	          <TextField
	            label="ad_id"
	            size="small"
	            value={adIdFilter}
	            onChange={(e) => {
	              setAdIdFilter(e.target.value);
	              setPage(0);
	            }}
	            sx={{ width: 140 }}
	          />
	          <TextField
	            label="creative_id"
	            size="small"
	            value={creativeIdFilter}
	            onChange={(e) => {
	              setCreativeIdFilter(e.target.value);
	              setPage(0);
	            }}
	            sx={{ width: 160 }}
	          />
	        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : links.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">생성된 링크가 없습니다</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600 }}>이름</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>채널</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>캠페인</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>상세</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>바인딩</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">클릭 수</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">가입 수</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>생성일</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">액션</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {link.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={link.utmSource}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {link.utmCampaign}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {[
                            link.utmContent && `content=${link.utmContent}`,
                            link.utmTerm && `term=${link.utmTerm}`,
                            link.utmId && `id=${link.utmId}`,
                          ].filter(Boolean).join(' · ') || '-'}
                        </Typography>
                        {link.destinationType === 'appstore_ios' && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                            iOS 지역: {inferIosRegion(link).toUpperCase()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ minWidth: 260, maxWidth: 360 }}>
                        {link.shortUrl ? (
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ wordBreak: 'break-all' }}
                          >
                            {link.shortUrl}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            추적 URL 없음
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ display: 'block', mt: 0.5, wordBreak: 'break-all' }}
                        >
                          도착: {link.destinationUrl}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {(link.bindings ?? []).map((binding) => `${binding.platform}:${binding.campaignId ?? binding.adId ?? binding.creativeId ?? '-'}`).join(', ') || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{link.clickCount ?? '-'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{link.signupCount ?? '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(link.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="최종 도착 URL 복사 (클릭 추적 없음)">
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(link.destinationUrl, '최종 도착 URL')}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {link.shortUrl && (
                            <Tooltip title="추적 URL 복사">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(link.shortUrl!, '추적 URL')}
                              >
                                <LinkIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="수정">
                            <IconButton size="small" onClick={() => openEdit(link)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="삭제">
                            <IconButton size="small" color="error" onClick={() => handleDelete(link)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={20}
              rowsPerPageOptions={[20]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />
          </>
        )}
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>링크 수정</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="이름"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
	          <TextField
	            label="메모"
	            fullWidth
	            multiline
	            rows={3}
	            value={editMemo}
	            onChange={(e) => setEditMemo(e.target.value)}
	            sx={{ mb: 2 }}
	          />
	          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
	            <TextField label="utm_content" value={editContent} onChange={(e) => setEditContent(e.target.value)} fullWidth />
	            <TextField label="utm_term" value={editTerm} onChange={(e) => setEditTerm(e.target.value)} fullWidth />
	            <TextField label="utm_id" value={editUtmId} onChange={(e) => setEditUtmId(e.target.value)} fullWidth />
		            <TextField select label="utm_source_platform" value={editSourcePlatform} onChange={(e) => setEditSourcePlatform(e.target.value)} fullWidth>
		              {UTM_SOURCE_PLATFORM_OPTIONS.map((option) => (
		                <MenuItem key={option.value || 'empty-source-platform'} value={option.value}>{option.label}</MenuItem>
		              ))}
		            </TextField>
		            <TextField select label="utm_creative_format" value={editCreativeFormat} onChange={(e) => setEditCreativeFormat(e.target.value)} fullWidth>
		              {UTM_CREATIVE_FORMAT_OPTIONS.map((option) => (
		                <MenuItem key={option.value || 'empty-creative-format'} value={option.value}>{option.label}</MenuItem>
		              ))}
		            </TextField>
		            <TextField select label="utm_marketing_tactic" value={editMarketingTactic} onChange={(e) => setEditMarketingTactic(e.target.value)} fullWidth>
		              {UTM_MARKETING_TACTIC_OPTIONS.map((option) => (
		                <MenuItem key={option.value || 'empty-marketing-tactic'} value={option.value}>{option.label}</MenuItem>
		              ))}
		            </TextField>
	          </Box>
	          {editLink?.destinationType === 'appstore_ios' && (
	            <TextField
	              select
	              label="App Store 지역"
	              value={editRegion}
	              onChange={(e) => setEditRegion(e.target.value as UtmRegion)}
	              fullWidth
	              sx={{ mt: 2 }}
	            >
	              <MenuItem value="kr">대한민국 (KR)</MenuItem>
	              <MenuItem value="jp">일본 (JP)</MenuItem>
	            </TextField>
	          )}
	          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
	            플랫폼 바인딩
	          </Typography>
	          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
	            <TextField select label="플랫폼" value={editBindingPlatform} onChange={(e) => {
	              setEditBindingPlatform(e.target.value as 'meta' | 'google_ads');
	              setBindingsEdited(true);
	            }} fullWidth>
	              {PLATFORM_BINDING_OPTIONS.map((option) => (
	                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
	              ))}
	            </TextField>
	            <TextField label="campaign_id" value={editCampaignId} onChange={(e) => {
	              setEditCampaignId(e.target.value);
	              setBindingsEdited(true);
	            }} fullWidth />
	            {editBindingPlatform === 'meta' ? (
	              <TextField label="adset_id" value={editAdsetId} onChange={(e) => {
	                setEditAdsetId(e.target.value);
	                setBindingsEdited(true);
	              }} fullWidth />
	            ) : (
	              <TextField label="ad_group_id" value={editAdGroupId} onChange={(e) => {
	                setEditAdGroupId(e.target.value);
	                setBindingsEdited(true);
	              }} fullWidth />
	            )}
	            <TextField label="ad_id" value={editAdId} onChange={(e) => {
	              setEditAdId(e.target.value);
	              setBindingsEdited(true);
	            }} fullWidth />
	            <TextField label="creative_id" value={editCreativeId} onChange={(e) => {
	              setEditCreativeId(e.target.value);
	              setBindingsEdited(true);
	            }} fullWidth />
	            <TextField select label="placement" value={editPlacement} onChange={(e) => {
	              setEditPlacement(e.target.value);
	              setBindingsEdited(true);
	            }} fullWidth>
	              {PLACEMENT_OPTIONS.map((option) => (
	                <MenuItem key={option.value || 'empty-placement'} value={option.value}>{option.label}</MenuItem>
	              ))}
	            </TextField>
	            <TextField select label="site_source_name" value={editSiteSourceName} onChange={(e) => {
	              setEditSiteSourceName(e.target.value);
	              setBindingsEdited(true);
	            }} fullWidth>
	              {SITE_SOURCE_NAME_OPTIONS.map((option) => (
	                <MenuItem key={option.value || 'empty-site-source-name'} value={option.value}>{option.label}</MenuItem>
	              ))}
	            </TextField>
	          </Box>
	        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            취소
          </Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSaving}>
            {editSaving ? <CircularProgress size={20} /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
