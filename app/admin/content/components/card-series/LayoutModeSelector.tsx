'use client';
import { Button } from '@heroui/react';
import { FileText as ArticleIcon, Image as ImageIcon } from 'lucide-react';
import type { CardNewsLayoutMode } from '@/app/admin/hooks/forms/schemas/card-news.schema';
interface LayoutModeSelectorProps {
    value: CardNewsLayoutMode;
    onChange: (value: CardNewsLayoutMode) => void;
    disabled?: boolean;
}
interface ModeOption {
    value: CardNewsLayoutMode;
    title: string;
    description: string;
    icon: React.ReactNode;
}
const MODE_OPTIONS: ModeOption[] = [
    {
        value: 'article',
        title: '본문형',
        description: '제목·본문·이미지 조합으로 구성된 기본 카드뉴스',
        icon: <ArticleIcon style={{ fontSize: 32 }}></ArticleIcon>,
    },
    {
        value: 'image_only',
        title: '이미지 전용',
        description: '풀블리드 이미지 카드 (이벤트·공지·비주얼 중심)',
        icon: <ImageIcon style={{ fontSize: 32 }}></ImageIcon>,
    },
];
export default function LayoutModeSelector({ value, onChange, disabled = false }: LayoutModeSelectorProps) {
    return (<div style={{ display: 'flex', gap: 16, opacity: disabled ? 0.5 : 1 }}>
      {MODE_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (<Button variant="tertiary" aria-label={option.title} isDisabled={disabled} aria-pressed={selected} key={option.value} onPress={() => onChange(option.value)} style={{ flex: 1, padding: 16, cursor: 'pointer', borderRadius: 2, border: selected ? '2px solid' : '1px solid', backgroundColor: selected ? 'rgba(122, 74, 226, 0.04)' : 'transparent', transition: 'all 0.15s', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ color: selected ? '#7A4AE2' : '#6b7280', marginTop: 4 }}>
              {option.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: selected ? '#7A4AE2' : '#111827', marginBottom: 4 }}>
                {option.title}
              </p>
              <p style={{ display: 'block', lineHeight: 1.4 }}>
                {option.description}
              </p>
            </div>
          </Button>);
        })}
    </div>);
}
