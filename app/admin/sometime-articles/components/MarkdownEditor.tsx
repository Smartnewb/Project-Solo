'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import TitleIcon from '@mui/icons-material/Title';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AdminService from '@/app/services/admin';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = '마크다운 형식으로 본문을 작성하세요...',
  minHeight = 400,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const handleBold = () => insertText('**', '**', '굵은 텍스트');
  const handleItalic = () => insertText('*', '*', '기울임 텍스트');
  const handleHeading = () => insertText('\n## ', '\n', '제목');
  const handleBulletList = () => insertText('\n- ', '\n', '목록 항목');
  const handleNumberList = () => insertText('\n1. ', '\n', '목록 항목');
  const handleQuote = () => insertText('\n> ', '\n', '인용문');
  const handleCode = () => insertText('`', '`', 'code');

  const handleLinkInsert = () => {
    if (linkUrl) {
      const markdownLink = linkText ? `[${linkText}](${linkUrl})` : `[링크](${linkUrl})`;
      insertAtCursor(markdownLink);
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      alert('JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    try {
      setUploading(true);
      const response = await AdminService.sometimeArticles.uploadImage(file);
      const imageMarkdown = `\n![이미지](${response.url})\n`;
      insertAtCursor(imageMarkdown);
    } catch (err: any) {
      console.error('이미지 업로드 실패:', err);
      alert(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const renderMarkdown = (text: string): string => {
    let html = text
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold and Italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.+?)`/g, '<code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">$1</code>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:16px 0;display:block;" />')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#1976d2;">$1</a>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:4px solid #ddd;padding-left:16px;margin:16px 0;color:#666;">$1</blockquote>')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');

    // Wrap consecutive li elements in ul
    html = html.replace(/(<li>.*?<\/li>\s*)+/g, '<ul style="margin:16px 0;padding-left:24px;">$&</ul>');

    return `<p>${html}</p>`;
  };

  return (
    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 1,
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#fafafa',
          flexWrap: 'wrap',
        }}
      >
        <Tooltip title="제목 (## )">
          <IconButton size="small" onClick={handleHeading}>
            <TitleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="굵게 (**텍스트**)">
          <IconButton size="small" onClick={handleBold}>
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="기울임 (*텍스트*)">
          <IconButton size="small" onClick={handleItalic}>
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="글머리 기호 목록">
          <IconButton size="small" onClick={handleBulletList}>
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="번호 목록">
          <IconButton size="small" onClick={handleNumberList}>
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="인용문">
          <IconButton size="small" onClick={handleQuote}>
            <FormatQuoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="코드">
          <IconButton size="small" onClick={handleCode}>
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="링크 삽입">
          <IconButton size="small" onClick={() => setLinkDialogOpen(true)}>
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="이미지 업로드">
          <IconButton size="small" component="label" disabled={uploading}>
            {uploading ? <CircularProgress size={18} /> : <ImageIcon fontSize="small" />}
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
            />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="edit">
            <Tooltip title="편집">
              <EditIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="split">
            <Tooltip title="분할">
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                <EditIcon fontSize="small" />
                <VisibilityIcon fontSize="small" />
              </Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="preview">
            <Tooltip title="미리보기">
              <VisibilityIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Editor Area */}
      <Box sx={{ display: 'flex', minHeight }}>
        {/* Edit Panel */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <Box
            sx={{
              flex: 1,
              borderRight: viewMode === 'split' ? '1px solid #e0e0e0' : 'none',
            }}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%',
                height: '100%',
                minHeight,
                padding: '16px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                boxSizing: 'border-box',
              }}
            />
          </Box>
        )}

        {/* Preview Panel */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflow: 'auto',
              bgcolor: '#fff',
              minHeight,
              '& h1, & h2, & h3': { mt: 2, mb: 1 },
              '& p': { mb: 1.5, lineHeight: 1.8 },
              '& img': { maxWidth: '100%', borderRadius: 1 },
              '& a': { color: 'primary.main' },
              '& blockquote': { borderLeft: '4px solid #ddd', pl: 2, color: 'text.secondary' },
              '& code': { bgcolor: '#f4f4f4', px: 0.75, py: 0.25, borderRadius: 0.5 },
              '& ul, & ol': { pl: 3 },
            }}
          >
            {value ? (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
            ) : (
              <Typography color="text.secondary">미리보기가 여기에 표시됩니다...</Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>링크 삽입</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="링크 텍스트"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="표시될 텍스트"
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>취소</Button>
          <Button onClick={handleLinkInsert} variant="contained" disabled={!linkUrl}>
            삽입
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
