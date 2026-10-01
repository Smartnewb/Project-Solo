'use client';
import { Button } from '@heroui/react';
import { useRef, useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import type { CardNewsLayoutMode } from '@/app/admin/hooks/forms/schemas/card-news.schema';
interface CardSection {
    order: number;
    title: string;
    content: string;
    imageUrl?: string;
}
interface CardNewsDetailPreviewProps {
    sections: CardSection[];
    layoutMode?: CardNewsLayoutMode;
}
const STORY_DURATION_MS = 3000;
/* ─── Image-Only Stories Preview ─── */
function ImageOnlyPreview({ sections }: {
    sections: CardSection[];
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const animFrameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const pausedAtRef = useRef<number>(0);
    const goTo = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(index, sections.length - 1));
        setCurrentIndex(clamped);
        setProgress(0);
        startTimeRef.current = 0;
    }, [sections.length]);
    const goNext = useCallback(() => {
        if (currentIndex < sections.length - 1) {
            goTo(currentIndex + 1);
        }
        else {
            goTo(0); // loop
        }
    }, [currentIndex, sections.length, goTo]);
    const goPrev = useCallback(() => {
        if (progress > 0.15) {
            // restart current
            setProgress(0);
            startTimeRef.current = 0;
        }
        else if (currentIndex > 0) {
            goTo(currentIndex - 1);
        }
    }, [currentIndex, progress, goTo]);
    // auto-advance timer with requestAnimationFrame
    useEffect(() => {
        if (isPaused || sections.length === 0)
            return;
        const tick = (timestamp: number) => {
            if (startTimeRef.current === 0) {
                startTimeRef.current = timestamp;
            }
            const elapsed = timestamp - startTimeRef.current;
            const pct = Math.min(elapsed / STORY_DURATION_MS, 1);
            setProgress(pct);
            if (pct >= 1) {
                goNext();
                return;
            }
            animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [currentIndex, isPaused, sections.length, goNext]);
    // pause on mousedown, resume on mouseup
    const handlePauseStart = () => {
        setIsPaused(true);
        pausedAtRef.current = progress;
        cancelAnimationFrame(animFrameRef.current);
    };
    const handlePauseEnd = () => {
        // adjust startTime so progress resumes from where it paused
        startTimeRef.current = performance.now() - pausedAtRef.current * STORY_DURATION_MS;
        setIsPaused(false);
    };
    const currentSection = sections[currentIndex];
    return (<div style={{ maxWidth: 428, marginInline: 'auto', marginTop: 32, marginBottom: 32, borderRadius: 2, overflow: 'hidden', border: '1px solid #333' }}>
      {/* 안내 라벨 */}
      <div style={{ padding: 12, backgroundColor: '#1a1a1a', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>
          이미지 전용 미리보기 (Instagram Stories)
        </p>
      </div>

      {/* Stories Container */}
      <div onMouseDown={handlePauseStart} onMouseUp={handlePauseEnd} onMouseLeave={() => {
            if (isPaused)
                handlePauseEnd();
        }} style={{ position: 'relative', width: '100%', backgroundColor: '#000000', overflow: 'hidden' }}>
        {/* Story Progress Bar */}
        <div style={{ position: 'absolute', top: '12px', left: '16px', right: '16px', display: 'flex', gap: '4px', zIndex: 11 }}>
          {sections.map((_, idx) => (<div key={idx} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: '#FFFFFF', borderRadius: '2px', width: idx < currentIndex
                    ? '100%'
                    : idx === currentIndex
                        ? `${progress * 100}%`
                        : '0%', transition: idx === currentIndex ? 'none' : 'width 0.2s ease' }}></div>
            </div>))}
        </div>

        {/* Header */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 16, paddingTop: '28px', paddingBottom: 16, zIndex: 12 }}>
          <p style={{ fontSize: 20, color: '#FFFFFF', cursor: 'pointer', lineHeight: 1 }}>
            {'<'}
          </p>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>
            카드뉴스
          </p>
          <div style={{ width: 20 }}></div>
        </div>

        {/* Image Card */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
          {currentSection?.imageUrl ? (<img src={currentSection.imageUrl} alt={`카드 ${currentIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }}></img>) : (<p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              이미지 없음
            </p>)}
        </div>

        {/* Touch zones: left/right tap */}
        <Button variant="tertiary" aria-label="이전 카드" onPress={goPrev} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '35%', zIndex: 10, cursor: 'pointer' }}></Button>
        <Button variant="tertiary" aria-label="다음 카드" onPress={goNext} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '65%', zIndex: 10, cursor: 'pointer' }}></Button>

        {/* Bottom Navigation */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, paddingInline: 24, paddingBlock: 16, zIndex: 12 }}>
          <Button variant="tertiary" aria-label="이전 카드" onPress={goPrev} style={{ color: currentIndex > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)', fontSize: 22, cursor: currentIndex > 0 ? 'pointer' : 'default', lineHeight: 1 }}>
            {'<'}
          </Button>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, minWidth: 48, textAlign: 'center' }}>
            {currentIndex + 1} / {sections.length}
          </p>
          <Button variant="tertiary" aria-label="다음 카드" onPress={goNext} style={{ color: '#FFFFFF', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>
            {'>'}
          </Button>
        </div>
      </div>

      {/* 하단 안내 */}
      <div style={{ padding: 12, backgroundColor: '#1a1a1a', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>
          클릭: 이전/다음 | 길게 누르기: 일시정지 | 3초마다 자동 전환
        </p>
      </div>
    </div>);
}
/* ─── Article Preview (기존) ─── */
function ArticlePreview({ sections }: {
    sections: CardSection[];
}) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const handleScroll = () => {
        if (!scrollContainerRef.current)
            return;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const containerWidth = scrollContainerRef.current.offsetWidth;
        const newIndex = Math.round(scrollLeft / containerWidth);
        if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
        }
    };
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container)
            return;
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [currentIndex]);
    const goToCard = (index: number) => {
        if (!scrollContainerRef.current)
            return;
        if (index >= 0 && index < sections.length) {
            const containerWidth = scrollContainerRef.current.offsetWidth;
            scrollContainerRef.current.scrollTo({
                left: containerWidth * index,
                behavior: 'smooth'
            });
        }
    };
    return (<div style={{ maxWidth: 428, marginInline: 'auto', marginTop: 32, marginBottom: 32, backgroundColor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ padding: 16, backgroundColor: '#fff' }}>
        <p style={{ color: '#666', textAlign: 'center' }}>
          카드뉴스 상세 미리보기 (좌우로 스크롤)
        </p>
      </div>

      {/* Header */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 16, backgroundColor: '#FFFFFF' }}>
        <div style={{ fontSize: 24, cursor: 'pointer' }}>{'<-'}</div>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#000000' }}>
          새로운 소식
        </p>
        <div style={{ width: 24 }}></div>
      </div>

      {/* Scroll Container */}
      <div ref={scrollContainerRef} style={{ position: 'relative', overflowX: 'auto', overflowY: 'hidden', backgroundColor: '#FFFFFF' }}>
        {/* Progress Dots */}
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', zIndex: 10 }}>
          {sections.map((_, index) => (<div key={index} style={{ width: currentIndex === index ? 18 : 6, height: 6, borderRadius: currentIndex === index ? '10px' : '3px', transition: 'all 0.3s' }}></div>))}
        </div>

        {/* Cards Wrapper */}
        <div style={{ display: 'flex', height: '100%' }}>
          {sections.map((section, index) => (<div key={index} style={{ width: '100%', minWidth: '100%', padding: '30px 20px 40px 20px', flexShrink: 0 }}>
              {/* Image Area */}
              <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {section.imageUrl ? (<img src={section.imageUrl} alt="카드 이미지" style={{ width: '100%', height: '100%', objectFit: 'cover' }}></img>) : (<p style={{ color: '#999', fontSize: 14 }}>이미지 없음</p>)}
              </div>

              {/* Text Area */}
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#000000', lineHeight: '32px', marginBottom: 16, opacity: section.title ? 1 : 0.6 }}>
                  {section.title || `카드 ${index + 1} 제목을 입력하세요`}
                </p>

                <div dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(section.content && section.content !== '<p><br></p>'
                    ? section.content
                    : '<p>카드 본문을 입력하세요</p>')
            }} style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: section.content && section.content !== '<p><br></p>' ? 1 : 0.6 }}></div>
              </div>
            </div>))}
        </div>

        {/* Touch Zones - Left */}
        <Button variant="tertiary" aria-label="이전 카드" onPress={() => goToCard(currentIndex - 1)} style={{ position: 'fixed', top: 156, bottom: 0, left: 'calc(50% - 214px)', width: '50%', maxWidth: 214, zIndex: 5, cursor: 'pointer', display: currentIndex > 0 ? 'block' : 'none' }}></Button>

        {/* Touch Zones - Right */}
        <Button variant="tertiary" aria-label="다음 카드" onPress={() => goToCard(currentIndex + 1)} style={{ position: 'fixed', top: 156, bottom: 0, right: 'calc(50% - 214px)', width: '50%', maxWidth: 214, zIndex: 5, cursor: 'pointer', display: currentIndex < sections.length - 1 ? 'block' : 'none' }}></Button>
      </div>

      {/* 안내 텍스트 */}
      <div style={{ padding: 16, backgroundColor: '#fff', textAlign: 'center' }}>
        <p style={{ color: '#999' }}>
          * 좌우로 스크롤하여 카드를 확인할 수 있습니다 ({currentIndex + 1}/{sections.length})
        </p>
      </div>
    </div>);
}
/* ─── Main Component ─── */
export default function CardNewsDetailPreview({ sections, layoutMode = 'article' }: CardNewsDetailPreviewProps) {
    if (sections.length === 0) {
        return (<div style={{ maxWidth: 428, marginInline: 'auto', marginTop: 32, marginBottom: 32, padding: 24, backgroundColor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0', textAlign: 'center' }}>
        <p style={{ marginBottom: 16, color: '#666' }}>
          카드뉴스 상세 미리보기
        </p>
        <p>
          카드를 추가하면 여기에 미리보기가 표시됩니다.
        </p>
      </div>);
    }
    if (layoutMode === 'image_only') {
        return <ImageOnlyPreview sections={sections}></ImageOnlyPreview>;
    }
    return <ArticlePreview sections={sections}></ArticlePreview>;
}
