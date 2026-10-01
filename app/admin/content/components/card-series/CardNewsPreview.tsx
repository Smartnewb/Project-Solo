interface CardNewsPreviewProps {
    title: string;
    description: string;
    backgroundImageUrl?: string;
    hasReward: boolean;
}
export default function CardNewsPreview({ title, description, backgroundImageUrl, hasReward }: CardNewsPreviewProps) {
    const displayTitle = title || '카드뉴스 제목을 입력하세요';
    const displayDescription = description || '카드뉴스 설명을 입력하세요';
    const displayBackground = backgroundImageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80';
    return (<div style={{ maxWidth: 428, marginInline: 'auto', marginBottom: 32, padding: 24, backgroundColor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
      <p style={{ marginBottom: 16, color: '#666' }}>
        📱 사용자 화면 미리보기
      </p>

      {/* Section Title */}
      <p style={{ fontSize: 20, fontWeight: 700, color: '#000000', marginBottom: 16, paddingInline: 8 }}>
        지금 주목할 소식
      </p>

      {/* Highlight Card */}
      <div style={{ position: 'relative', height: 280, borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}>
        {/* Background Image */}
        <img src={displayBackground} alt="카드뉴스 배경" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}></img>

        {/* Gradient Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></div>

        {/* Reward Badge */}
        {hasReward && (<div style={{ position: 'absolute', top: '20px', left: '20px', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', color: '#FFFFFF', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            🎁 보상
          </div>)}

        {/* Card Content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', lineHeight: '32px', marginBottom: 8, display: '-webkit-box', overflow: 'hidden', opacity: title ? 1 : 0.6 }}>
            {displayTitle}
          </p>

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.95)', lineHeight: '20px', marginBottom: 16, display: '-webkit-box', overflow: 'hidden', opacity: description ? 1 : 0.6 }}>
            {displayDescription}
          </p>

          <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '20px', color: '#ff385c', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
            지금 확인하기 →
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: '6px' }}>
        <div style={{ width: 36, height: 8, borderRadius: '10px' }}></div>
        <div style={{ width: 8, height: 8, borderRadius: '4px' }}></div>
        <div style={{ width: 8, height: 8, borderRadius: '4px' }}></div>
      </div>

      <p style={{ display: 'block', textAlign: 'center', marginTop: 16, color: '#999' }}>
        * 실제 앱 화면에서 보이는 모습입니다
      </p>
    </div>);
}
