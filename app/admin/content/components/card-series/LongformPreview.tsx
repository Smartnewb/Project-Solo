'use client';
import { Chip } from '@heroui/react';
import { Heart as FavoriteBorderIcon, Share as IosShareIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
interface LongformPreviewProps {
    title: string;
    subtitle?: string;
    description?: string;
    categoryLabel: string;
    heroImageUrl?: string;
    body: string;
    readTimeMinutes: number;
}
export default function LongformPreview({ title, subtitle, description, categoryLabel, heroImageUrl, body, readTimeMinutes, }: LongformPreviewProps) {
    return (<div style={{ width: 390, height: 844, border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 56 }}>
        {heroImageUrl ? (<div style={{ width: '100%', height: 220, backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f0f0f0' }}></div>) : (<div style={{ width: '100%', height: 220, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>
              Hero 이미지 미리보기
            </p>
          </div>)}

        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Chip>{categoryLabel || '카테고리'}</Chip>
            <p>
              {readTimeMinutes}분
            </p>
          </div>

          <h1 style={{ marginBottom: 8 }} className="text-2xl font-bold">
            {title || '제목'}
          </h1>
          {subtitle && (<p style={{ marginBottom: 8 }}>
              {subtitle}
            </p>)}
          {description && (<p style={{ marginBottom: 16 }}>
              {description}
            </p>)}

          <div style={{ marginTop: 16 }}>
            {body ? (<ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>) : (<p>
                본문을 입력하면 여기에 미리보기가 표시됩니다.
              </p>)}
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingInline: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: "#6b7280" }}>
          <FavoriteBorderIcon></FavoriteBorderIcon>
          <p>좋아요</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: "#6b7280" }}>
          <IosShareIcon></IosShareIcon>
          <p>공유</p>
        </div>
      </div>
    </div>);
}
