'use client';
import { Button, Spinner, Modal, TextField, Label, Input, TextArea } from '@heroui/react';
import { Bold as FormatBoldIcon, Italic as FormatItalicIcon, List as FormatListBulletedIcon, ListOrdered as FormatListNumberedIcon, Quote as FormatQuoteIcon, Link as LinkIcon, Image as ImageIcon, Heading as TitleIcon, Code as CodeIcon, Eye as VisibilityIcon, Pencil as EditIcon } from 'lucide-react';
import { useState, useRef, useCallback, type ReactNode } from 'react';
import DOMPurify from 'dompurify';
import AdminService from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
    renderPreview?: (value: string) => ReactNode;
}
export default function MarkdownEditor({ value, onChange, placeholder = '마크다운 형식으로 본문을 작성하세요...', minHeight = 400, renderPreview, }: MarkdownEditorProps) {
    const toast = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea)
            return;
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
        if (!textarea)
            return;
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
        closeLinkDialog();
    };
    const closeLinkDialog = () => {
        setLinkDialogOpen(false);
        setLinkUrl('');
        setLinkText('');
    };
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
            toast.error('JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('파일 크기는 10MB 이하여야 합니다.');
            return;
        }
        try {
            setUploading(true);
            const response = await AdminService.sometimeArticles.uploadImage(file);
            const imageMarkdown = `\n![이미지](${response.url})\n`;
            insertAtCursor(imageMarkdown);
        }
        catch (err: any) {
            toast.error(err.message || '이미지 업로드에 실패했습니다.');
        }
        finally {
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
    return (<div style={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 8, backgroundColor: '#fafafa', flexWrap: 'wrap' }}>
        <span title={"제목 (## )"}>
          <Button aria-label="제목" onPress={handleHeading} variant="tertiary" isIconOnly={true}>
            <TitleIcon></TitleIcon>
          </Button>
        </span>
        <span title={"굵게 (**텍스트**)"}>
          <Button aria-label="굵게" onPress={handleBold} variant="tertiary" isIconOnly={true}>
            <FormatBoldIcon></FormatBoldIcon>
          </Button>
        </span>
        <span title={"기울임 (*텍스트*)"}>
          <Button aria-label="기울임" onPress={handleItalic} variant="tertiary" isIconOnly={true}>
            <FormatItalicIcon></FormatItalicIcon>
          </Button>
        </span>
        <hr style={{ marginInline: 4 }}></hr>
        <span title={"글머리 기호 목록"}>
          <Button aria-label="목록" onPress={handleBulletList} variant="tertiary" isIconOnly={true}>
            <FormatListBulletedIcon></FormatListBulletedIcon>
          </Button>
        </span>
        <span title={"번호 목록"}>
          <Button aria-label="번호 목록" onPress={handleNumberList} variant="tertiary" isIconOnly={true}>
            <FormatListNumberedIcon></FormatListNumberedIcon>
          </Button>
        </span>
        <span title={"인용문"}>
          <Button aria-label="인용" onPress={handleQuote} variant="tertiary" isIconOnly={true}>
            <FormatQuoteIcon></FormatQuoteIcon>
          </Button>
        </span>
        <span title={"코드"}>
          <Button aria-label="코드" onPress={handleCode} variant="tertiary" isIconOnly={true}>
            <CodeIcon></CodeIcon>
          </Button>
        </span>
        <hr style={{ marginInline: 4 }}></hr>
        <span title={"링크 삽입"}>
          <Button aria-label="링크 삽입" onPress={() => setLinkDialogOpen(true)} variant="tertiary" isIconOnly={true}>
            <LinkIcon></LinkIcon>
          </Button>
        </span>
        <span title={"이미지 업로드"}>
          <Button onPress={() => fileInputRef.current?.click()} aria-label="이미지 업로드" isDisabled={uploading} variant="tertiary" isIconOnly={true}>
            {uploading ? <Spinner size="sm"></Spinner> : <ImageIcon></ImageIcon>}
          </Button>
          <input ref={fileInputRef} type="file" hidden accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload}></input>
        </span>

        <div style={{ flex: 1 }}></div>

        <div className="flex gap-2" aria-label="편집 모드">{(['edit', 'split', 'preview'] as const).map(mode => <Button key={mode} variant={viewMode === mode ? 'primary' : 'secondary'} aria-pressed={viewMode === mode} onPress={() => setViewMode(mode)}>{mode === 'edit' ? '편집' : mode === 'split' ? '분할' : '미리보기'}</Button>)}</div>
      </div>

      {/* Editor Area */}
      <div style={{ display: 'flex' }}>
        {/* Edit Panel */}
        {(viewMode === 'edit' || viewMode === 'split') && (<div style={{ flex: 1 }}>
            <TextArea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
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
            }}></TextArea>
          </div>)}

        {/* Preview Panel */}
        {(viewMode === 'preview' || viewMode === 'split') && (<div style={{ flex: 1, padding: 16, overflow: 'auto', backgroundColor: '#fff' }}>
            {value ? (renderPreview ? renderPreview(value) : <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(value)) }}></div>) : (<p>미리보기가 여기에 표시됩니다...</p>)}
          </div>)}
      </div>

      {/* Link Dialog */}
      <Modal.Backdrop isOpen={linkDialogOpen} onOpenChange={next => {
            if (!next)
                closeLinkDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
        <Modal.Heading>링크 삽입</Modal.Heading>
        <Modal.Body>
          <TextField className="mb-4"><Label>{"링크 텍스트"}</Label><Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="표시될 텍스트"></Input></TextField>
          <TextField className="mb-4"><Label>{"URL"}</Label><Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com"></Input></TextField>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={closeLinkDialog} variant="tertiary">취소</Button>
          <Button onPress={handleLinkInsert} isDisabled={!linkUrl} variant="primary">
            삽입
          </Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </div>);
}
