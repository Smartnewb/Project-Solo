'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { SupportDomain } from '@/app/types/support-chat';
import {
  QUICK_REPLY_VARIABLES,
  addQuickReply,
  applyQuickReplyVariables,
  getQuickReplies,
  removeQuickReply,
  sortRepliesForDomain,
  type QuickReply,
} from '../lib/quick-replies';

interface QuickReplyDialogProps {
  open: boolean;
  onClose: () => void;
  /** 현재 세션 도메인(우선 정렬용) */
  domain?: SupportDomain;
  /** 변수 치환용 닉네임 */
  nickname?: string;
  /** 선택한 템플릿(치환 적용된 본문)을 입력창에 삽입 */
  onSelect: (content: string) => void;
}

export default function QuickReplyDialog({
  open,
  onClose,
  domain,
  nickname,
  onSelect,
}: QuickReplyDialogProps) {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    if (open) {
      setReplies(getQuickReplies());
      setCreating(false);
      setNewTitle('');
      setNewContent('');
    }
  }, [open]);

  const sorted = useMemo(() => sortRepliesForDomain(replies, domain), [replies, domain]);

  const handleSelect = (reply: QuickReply) => {
    onSelect(applyQuickReplyVariables(reply.content, { nickname }));
    onClose();
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setReplies(addQuickReply({ domain: domain ?? 'all', title: newTitle, content: newContent }));
    setCreating(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleRemove = (id: string) => {
    setReplies(removeQuickReply(id));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        빠른 답변 템플릿
        <IconButton size="small" onClick={onClose} aria-label="닫기">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <List sx={{ py: 0 }}>
          {sorted.map((reply) => (
            <ListItemButton
              key={reply.id}
              onClick={() => handleSelect(reply)}
              sx={{ borderRadius: 1, mb: 0.5, alignItems: 'flex-start' }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {reply.title}
                  </Typography>
                  {reply.domain !== 'all' && (
                    <Chip label={reply.domain} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                  )}
                  {reply.builtin && (
                    <Chip label="기본" size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {reply.content}
                </Typography>
              </Box>
              {!reply.builtin && (
                <Tooltip title="삭제">
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(reply.id);
                    }}
                    aria-label="템플릿 삭제"
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ my: 1.5 }} />

        {creating ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              size="small"
              label="템플릿 제목"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              inputProps={{ maxLength: 40 }}
              autoFocus
            />
            <TextField
              size="small"
              label="답변 내용"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              multiline
              minRows={3}
              inputProps={{ maxLength: 2000 }}
            />
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {QUICK_REPLY_VARIABLES.map((v) => (
                <Chip
                  key={v.token}
                  label={`${v.label} ${v.token}`}
                  size="small"
                  variant="outlined"
                  onClick={() => setNewContent((prev) => `${prev}${v.token}`)}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button size="small" onClick={() => setCreating(false)}>
                취소
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newContent.trim()}
              >
                저장
              </Button>
            </Box>
          </Box>
        ) : (
          <Button size="small" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
            새 템플릿 추가
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
