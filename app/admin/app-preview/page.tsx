'use client';

import { Box, Typography, Chip } from '@mui/material';
import { useState, useEffect, useRef } from 'react';

// ─── Design tokens (실제 sometimes-app에서 추출) ───────────────────
const T = {
  brand: {
    primary: '#7A4AE2',
    cta: '#3871FF',
    accent: '#A892D7',
    secondary: '#9747FF',
    deep: '#49386E',
    light: '#E2D5FF',
  },
  surface: {
    bg: '#FFFFFF',
    surface: '#F8F9FA',
    secondary: '#F7F3FF',
    tertiary: '#F2EDFF',
    other: '#E1D9FF',
    dark: '#1C1C2E',
    dark2: '#2D1B4E',
  },
  text: {
    primary: '#000000',
    secondary: '#333333',
    muted: '#7C7C7C',
    disabled: '#AEAEAE',
    white: '#FFFFFF',
  },
  state: {
    attention: '#F70A8D',
    success: '#37DA1A',
    error: '#E8586D',
  },
};

// ─── 화면 목록 ───────────────────────────────────────────────────
const SCREENS = [
  { id: 'home', label: '홈' },
  { id: 'match', label: '매칭 결과' },
  { id: 'compatibility', label: '호환성' },
  { id: 'chat', label: '채팅' },
  { id: 'buttons', label: '버튼 시스템' },
] as const;
type ScreenId = (typeof SCREENS)[number]['id'];

// ─── 공용 스타일 ──────────────────────────────────────────────────
const phoneScreen: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: T.surface.bg,
  fontFamily: '-apple-system, "Pretendard", "Noto Sans KR", sans-serif',
  overflowY: 'auto',
  position: 'relative',
};

// ─── 홈 화면 ──────────────────────────────────────────────────────
function HomeScreen() {
  const [count, setCount] = useState(0);
  const target = 12847;

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 25);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={phoneScreen}>
      {/* 상태바 */}
      <div style={{ background: T.surface.bg, padding: '12px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700 }}>9:41</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ width: 4, height: 4 + i * 2, background: '#000', borderRadius: 1 }} />)}
        </div>
      </div>

      {/* 헤더 */}
      <div style={{ padding: '8px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: T.brand.primary }}>sometime</span>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.surface.tertiary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={T.text.secondary} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* 매칭 카운터 카드 */}
      <div style={{ margin: '0 16px 12px', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(122,74,226,0.15)' }}>
        <div style={{ background: 'linear-gradient(135deg, #AB69B0 0%, #7A4AE2 28%, #D86B89 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 12px', minWidth: 80, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: 0.3 }}>
              {count.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>누적 매칭 성사</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>이번 주에도 새로운 연결이 시작됐어요</div>
          </div>
        </div>
      </div>

      {/* 매칭 성공률 카드 */}
      <div style={{ margin: '0 16px 12px', background: '#F6F2FF', borderRadius: 20, padding: '18px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F', textAlign: 'center', marginBottom: 12 }}>
          썸타임 매칭 현황
        </div>
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#313131', lineHeight: 1.1 }}>89%</div>
            <div style={{ fontSize: 11, color: '#363636', fontWeight: 300, marginTop: 2 }}>매칭 성공률</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: 2, height: 4, borderRadius: 2, background: '#DFC7FF' }} />
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#313131', lineHeight: 1.1 }}>2,847</div>
            <div style={{ fontSize: 11, color: '#363636', fontWeight: 300, marginTop: 2 }}>이번 주 신규 매칭</div>
          </div>
        </div>
      </div>

      {/* 프로필 사진 카드 */}
      <div style={{ margin: '0 16px 12px', background: '#F8F4FF', borderRadius: 20, padding: '20px 16px', position: 'relative', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 50 }}>
          {[{ label: '필수', isPrimary: true }, { label: '' }].map((slot, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 12,
                border: `2px dashed ${slot.isPrimary ? T.brand.accent : '#ccc'}`,
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
              }}>
                <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                  <path d="M10.5 4.5V16.5M4.5 10.5H16.5" stroke={T.brand.accent} strokeWidth={2} strokeLinecap="round"/>
                </svg>
              </div>
              {slot.label && <span style={{ fontSize: 10, color: slot.isPrimary ? T.brand.primary : '#8E8E8E' }}>{slot.label}</span>}
            </div>
          ))}
          {/* 마스코트 */}
          <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', fontSize: 48, lineHeight: 1 }}>🐱</div>
          {[{ label: '추천' }, { label: '추천' }].map((slot, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, border: '2px dashed #ccc', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                  <path d="M10.5 4.5V16.5M4.5 10.5H16.5" stroke="#ccc" strokeWidth={2} strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 10, color: '#8E8E8E' }}>{slot.label}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>프로필 사진을 등록해주세요</div>
          <div style={{ fontSize: 11, color: T.text.muted }}>사진이 있으면 <span style={{ color: T.brand.primary }}>3배 더 많이</span> 노출돼요</div>
        </div>
        <div style={{ position: 'absolute', right: 20, bottom: 52, width: 40, height: 40, borderRadius: '50%', background: T.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="#fff" strokeWidth={2} strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* 하단 탭바 */}
      <div style={{ position: 'sticky', bottom: 0, background: T.surface.bg, borderTop: '1px solid #f0f0f0', display: 'flex', padding: '8px 0 16px' }}>
        {['홈', '탐색', '채팅', '더보기'].map((tab, i) => (
          <div key={tab} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ width: 22, height: 22, margin: '0 auto 2px', background: i === 0 ? T.brand.primary : '#d0d0d0', borderRadius: 6, opacity: i === 0 ? 1 : 0.4 }} />
            <div style={{ fontSize: 9, color: i === 0 ? T.brand.primary : T.text.muted, fontWeight: i === 0 ? 700 : 400 }}>{tab}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 매칭 결과 화면 ───────────────────────────────────────────────
function MatchScreen() {
  const [liked, setLiked] = useState(false);
  const [shimmerPos, setShimmerPos] = useState(-1);

  useEffect(() => {
    const loop = setInterval(() => {
      setShimmerPos(-1);
      requestAnimationFrame(() => {
        setTimeout(() => setShimmerPos(1), 50);
      });
    }, 3000);
    return () => clearInterval(loop);
  }, []);

  return (
    <div style={{ ...phoneScreen, background: T.surface.bg }}>
      {/* 헤더 */}
      <div style={{ padding: '48px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.surface.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="#333" strokeWidth={2} strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700 }}>오늘의 매칭</span>
      </div>

      {/* 프로필 사진 영역 */}
      <div style={{ margin: '0 16px', borderRadius: 20, overflow: 'hidden', aspectRatio: '1', background: 'linear-gradient(135deg, #e8d5ff, #ffd5e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80 }}>👩</div>
          <div style={{ marginTop: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '4px 12px', display: 'inline-block' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>온라인</span>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#37DA1A', marginLeft: 6, verticalAlign: 'middle' }} />
          </div>
        </div>
      </div>

      {/* 이름·정보 */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800 }}>지은 </span>
            <span style={{ fontSize: 18, fontWeight: 400, color: T.text.muted }}>23세</span>
          </div>
          <div style={{ background: T.surface.secondary, borderRadius: 999, padding: '4px 10px' }}>
            <span style={{ fontSize: 11, color: T.brand.primary, fontWeight: 600 }}>한밭대학교</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {['INFJ', '여행 좋아요', '고양이 집사', '독서'].map(tag => (
            <span key={tag} style={{ background: T.surface.tertiary, borderRadius: 999, padding: '4px 10px', fontSize: 11, color: T.brand.deep, fontWeight: 500 }}>
              {tag}
            </span>
          ))}
        </div>

        {/* 좋아요 버튼 (shimmer) */}
        <div
          onClick={() => setLiked(!liked)}
          style={{
            width: '100%', height: 56, borderRadius: 16, overflow: 'hidden',
            border: '3px solid #6B3FD4', cursor: 'pointer', position: 'relative',
            background: liked ? T.surface.secondary : 'linear-gradient(135deg, #9B6DFF, #7A4AE2, #6B3FD4)',
          }}
        >
          {!liked && (
            <div style={{
              position: 'absolute', inset: 0, overflow: 'hidden',
              animation: 'shimmer 3s infinite',
            }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                transform: `translateX(${shimmerPos === 1 ? '300%' : '-100%'})`,
                transition: shimmerPos === 1 ? 'transform 1.8s ease-in-out' : 'none',
              }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{liked ? '💜' : '💜'}</span>
            <span style={{ color: liked ? T.brand.primary : '#fff', fontSize: 16, fontWeight: 700 }}>
              {liked ? '좋아요 완료!' : '좋아요 보내기'}
            </span>
          </div>
        </div>

        {liked && (
          <div style={{ marginTop: 8, padding: '12px 16px', background: T.surface.secondary, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: T.brand.primary, fontWeight: 600 }}>💜 서로 좋아요! 대화를 시작해보세요</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 호환성 카드 화면 ─────────────────────────────────────────────
function CompatibilityScreen() {
  const [showDetail, setShowDetail] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(78), 500);
    return () => clearTimeout(timer);
  }, []);

  const C_MINE = '#A892D7';
  const C_PARTNER = '#FF69B4';
  const C_SHARED = '#FFD700';

  const keywords = {
    mine: ['여행', '독서', '카페투어', '영화'],
    partner: ['음악', '독서', '여행', '요리'],
    shared: ['여행', '독서'],
  };

  const tracks = [
    { label: '여행  ↔  여행', score: 98, color: C_MINE },
    { label: '독서  ↔  독서', score: 95, color: C_MINE },
    { label: '카페투어  ↔  음악', score: 72, color: 'rgba(168,146,215,0.8)' },
    { label: '영화  ↔  요리', score: 61, color: 'rgba(168,146,215,0.6)' },
  ];

  return (
    <div style={{ ...phoneScreen, background: '#0f0f1a' }}>
      {/* 미리보기 카드 */}
      <div style={{ margin: '20px 12px 8px', borderRadius: 16, overflow: 'hidden' }}>
        <div
          onClick={() => setShowDetail(true)}
          style={{ background: 'linear-gradient(135deg, #1C1C2E, #2D1B4E)', padding: 16, cursor: 'pointer' }}
        >
          {/* 헤더 */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: `linear-gradient(135deg, ${C_MINE}, ${C_PARTNER})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>매칭 바이브 플레이리스트</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                4 트랙 · 동기화율 <span style={{ color: C_SHARED, fontWeight: 700 }}>78%</span>
              </div>
            </div>
          </div>

          {/* 진행바 */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 14, position: 'relative', overflow: 'visible' }}>
            <div style={{
              height: '100%', width: `${barWidth}%`, borderRadius: 2,
              background: `linear-gradient(90deg, ${C_MINE}, ${C_SHARED})`,
              transition: 'width 1.5s ease-out',
            }} />
            <div style={{
              position: 'absolute', top: -3.5, left: `${barWidth}%`,
              width: 10, height: 10, borderRadius: '50%', background: '#fff',
              transform: 'translateX(-50%)',
              transition: 'left 1.5s ease-out',
              boxShadow: '0 0 6px rgba(0,0,0,0.5)',
            }} />
          </div>

          {/* 트랙 리스트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            {tracks.map((track, i) => (
              <div key={track.label} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                background: i === 0 ? 'rgba(168,146,215,0.15)' : 'rgba(255,255,255,0.04)',
                border: i === 0 ? '1px solid rgba(168,146,215,0.3)' : 'none',
              }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 16, textAlign: 'center' }}>
                  {i === 0 ? (
                    <span style={{ display: 'inline-flex', gap: 1, alignItems: 'flex-end' }}>
                      {[12, 14, 10].map((h, j) => <span key={j} style={{ display: 'inline-block', width: 2, height: h, background: C_MINE, borderRadius: 1 }} />)}
                    </span>
                  ) : i + 1}
                </span>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `rgba(168,146,215,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: track.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: i === 0 ? 700 : 600, color: i === 0 ? C_MINE : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>유사 키워드</div>
                </div>
                <div style={{
                  background: i === 0 ? C_MINE : 'rgba(255,255,255,0.06)',
                  borderRadius: 999, padding: '2px 8px',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: i === 0 ? '#fff' : track.color }}>{track.score}%</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C_MINE }}>전체 바이브 보기</span>
          </div>
        </div>
      </div>

      {/* 키워드 히트맵 */}
      <div style={{ margin: '0 12px', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C_MINE, letterSpacing: 2, marginBottom: 12 }}>KEYWORD HEATMAP</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C_MINE, letterSpacing: 1, marginBottom: 8 }}>나의 키워드</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {keywords.mine.map(kw => {
              const isShared = keywords.shared.includes(kw);
              return (
                <span key={kw} style={{
                  padding: '5px 10px', borderRadius: 20, border: '1px solid',
                  borderColor: isShared ? 'rgba(255,215,0,0.35)' : 'rgba(168,146,215,0.4)',
                  background: isShared ? 'rgba(255,215,0,0.12)' : 'rgba(168,146,215,0.3)',
                  fontSize: 12, fontWeight: 600,
                  color: isShared ? C_SHARED : C_MINE,
                }}>
                  {isShared && '★ '}{kw}
                </span>
              );
            })}
          </div>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C_PARTNER, letterSpacing: 1, marginBottom: 8 }}>상대방 키워드</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {keywords.partner.map(kw => {
              const isShared = keywords.shared.includes(kw);
              return (
                <span key={kw} style={{
                  padding: '5px 10px', borderRadius: 20, border: '1px solid',
                  borderColor: isShared ? 'rgba(255,215,0,0.35)' : 'rgba(255,105,180,0.4)',
                  background: isShared ? 'rgba(255,215,0,0.12)' : 'rgba(255,105,180,0.3)',
                  fontSize: 12, fontWeight: 600,
                  color: isShared ? C_SHARED : C_PARTNER,
                }}>
                  {isShared && '★ '}{kw}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 전체 보기 모달 */}
      {showDetail && (
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}
          onClick={() => setShowDetail(false)}
        >
          <div
            style={{ width: '100%', background: '#1C1C2E', borderRadius: '24px 24px 0 0', padding: '16px', maxHeight: '80%', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
            <div style={{ background: `linear-gradient(135deg, ${C_MINE}, #6B3FA0, ${C_PARTNER})`, borderRadius: 16, padding: '32px 24px', textAlign: 'center', marginBottom: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: 2, marginBottom: 14 }}>MATCHING VIBE</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 1, marginBottom: 16 }}>OUR MATCH VIBE</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>78%</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>취향과 스타일이 잘 맞는 매칭이에요</div>
            </div>
            {[
              { label: '스타일 호환도', value: 82 },
              { label: '내 이상형 매칭', value: 75 },
              { label: '상대방 이상형 매칭', value: 77 },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', width: 100 }}>{item.label}</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.value}%`, background: `linear-gradient(90deg, ${C_MINE}, ${C_SHARED})`, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E2D5FF', width: 32, textAlign: 'right' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 채팅 화면 ────────────────────────────────────────────────────
function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: '안녕하세요! 반갑습니다 😊', mine: false, time: '오후 3:12' },
    { id: 2, text: '안녕하세요~! 저도 반가워요 ㅎㅎ', mine: true, time: '오후 3:13' },
    { id: 3, text: '프로필 보니까 여행 좋아하시더라고요!', mine: false, time: '오후 3:14' },
    { id: 4, text: '맞아요! 최근에 제주도 다녀왔는데 너무 좋았어요', mine: true, time: '오후 3:15' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [coachingTip, setCoachingTip] = useState<string | null>('여행 경험 공유해보기');

  const send = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), text: input, mine: true, time: '오후 3:' + (16 + messages.length) };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(), text: '오 정말요? 제주도 어디가 제일 좋으셨어요?', mine: false, time: '오후 3:' + (17 + messages.length),
      }]);
    }, 1500);
  };

  return (
    <div style={{ ...phoneScreen, display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ background: T.surface.bg, borderBottom: '1px solid #f0f0f0', padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #e8d5ff, #ffd5e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👩</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>지은</div>
          <div style={{ fontSize: 10, color: T.state.success, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: T.state.success }} />
            온라인
          </div>
        </div>
      </div>

      {/* 새 매칭 배너 */}
      <div style={{ margin: '8px 12px', border: `1px solid ${T.brand.primary}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>
          서로 <span style={{ color: T.brand.primary, fontWeight: 800 }}>좋아요</span>를 눌렀어요! 대화를 시작해보세요 💌
        </div>
        <div style={{ fontSize: 10, color: T.text.disabled, marginTop: 2 }}>서로 관심있어 해요</div>
      </div>

      {/* 코칭 칩 */}
      {coachingTip && (
        <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexShrink: 0 }}>
          <div
            onClick={() => { setInput(coachingTip); setCoachingTip(null); }}
            style={{ background: T.surface.secondary, borderRadius: 999, padding: '4px 12px', fontSize: 11, color: T.brand.primary, cursor: 'pointer', border: `1px solid ${T.brand.light}` }}
          >
            💡 {coachingTip}
          </div>
        </div>
      )}

      {/* 메시지 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.mine ? 'flex-end' : 'flex-start', gap: 6, alignItems: 'flex-end' }}>
            {!msg.mine && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #e8d5ff, #ffd5e8)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>👩</div>}
            <div style={{ maxWidth: '68%' }}>
              <div style={{
                background: msg.mine ? `linear-gradient(135deg, ${T.brand.primary}, #9747FF)` : T.surface.surface,
                color: msg.mine ? '#fff' : T.text.primary,
                borderRadius: msg.mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '8px 12px', fontSize: 12, lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: 9, color: T.text.disabled, textAlign: msg.mine ? 'right' : 'left', marginTop: 2 }}>{msg.time}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #e8d5ff, #ffd5e8)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👩</div>
            <div style={{ background: T.surface.surface, borderRadius: '16px 16px 16px 4px', padding: '10px 14px', display: 'flex', gap: 3, alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: T.text.disabled, animation: `bounce 1s ${delay}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 입력 */}
      <div style={{ padding: '8px 12px 24px', background: T.surface.bg, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="메시지 입력..."
          style={{ flex: 1, border: `1px solid #e0e0e0`, borderRadius: 999, padding: '8px 14px', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={send}
          style={{ width: 36, height: 36, borderRadius: '50%', background: T.brand.primary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" strokeWidth={2} strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

// ─── 버튼 시스템 화면 ─────────────────────────────────────────────
function ButtonsScreen() {
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const variants = [
    { name: 'primary', label: '확인', style: { background: T.brand.primary, color: '#fff', border: `1px solid ${T.brand.primary}` } },
    { name: 'cta', label: '좋아요 보내기', style: { background: `linear-gradient(135deg, #9B6DFF, ${T.brand.primary}, #6B3FD4)`, color: '#fff', border: 'none' } },
    { name: 'secondary', label: '나중에', style: { background: T.surface.surface, color: T.text.muted, border: `2px solid #e4e2e2` } },
    { name: 'outline', label: '더보기', style: { background: 'transparent', color: T.brand.primary, border: `1px solid ${T.brand.primary}` } },
    { name: 'white', label: '취소', style: { background: '#fff', color: T.brand.primary, border: `1px solid ${T.brand.primary}` } },
    { name: 'subtle', label: '닫기', style: { background: '#fff', color: T.text.secondary, border: '1px solid #e4e2e2' } },
  ] as const;

  const sizes = [
    { name: 'lg', height: 60, label: 'Large (60px)' },
    { name: 'md', height: 50, label: 'Medium (50px)' },
    { name: 'sm', height: 34, label: 'Small (34px)' },
    { name: 'chip', height: 41, label: 'Chip (41px)' },
  ] as const;

  const chips = ['INFJ', '여행', '독서', '카페투어', '음악', '고양이 집사', '영화'];
  const [selectedChips, setSelectedChips] = useState<string[]>(['여행', 'INFJ']);

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
  };

  return (
    <div style={{ ...phoneScreen, padding: '44px 16px 24px', overflowY: 'auto' }}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: T.text.primary }}>버튼 시스템</div>

      {/* 버튼 variants */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text.muted, letterSpacing: 1, marginBottom: 10 }}>VARIANTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {variants.map(v => (
            <button
              key={v.name}
              onClick={() => setActiveVariant(activeVariant === v.name ? null : v.name)}
              style={{
                width: '100%', height: 50, borderRadius: 9999,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transform: activeVariant === v.name ? 'scale(0.97)' : 'scale(1)',
                transition: 'transform 0.1s ease, opacity 0.1s ease',
                opacity: activeVariant === v.name ? 0.85 : 1,
                fontFamily: 'inherit',
                ...v.style,
              } as React.CSSProperties}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* 사이즈 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text.muted, letterSpacing: 1, marginBottom: 10 }}>SIZES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sizes.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: T.text.disabled, width: 90 }}>{s.label}</span>
              <button style={{
                flex: 1, height: s.height, borderRadius: 9999,
                background: T.brand.primary, color: '#fff', border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                버튼
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 키워드 칩 */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text.muted, letterSpacing: 1, marginBottom: 10 }}>KEYWORD CHIPS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chips.map(chip => {
            const selected = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                onClick={() => toggleChip(chip)}
                style={{
                  height: 38, padding: '0 14px', borderRadius: 9999,
                  background: selected ? T.brand.primary : T.surface.surface,
                  color: selected ? '#fff' : T.text.muted,
                  border: `${selected ? '1px' : '2px'} solid ${selected ? T.brand.primary : '#e4e2e2'}`,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transform: selected ? 'scale(0.97)' : 'scale(1)',
                  transition: 'all 0.15s ease', fontFamily: 'inherit',
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: T.text.disabled, marginTop: 8 }}>탭해서 선택/해제</div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────
export default function AppPreviewPage() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home': return <HomeScreen />;
      case 'match': return <MatchScreen />;
      case 'compatibility': return <CompatibilityScreen />;
      case 'chat': return <ChatScreen />;
      case 'buttons': return <ButtonsScreen />;
    }
  };

  const screenLabels: Record<ScreenId, string> = {
    home: '홈 화면 — 매칭 카운터, 프로필 사진 카드',
    match: '매칭 결과 — 프로필 카드, 좋아요 버튼 (shimmer)',
    compatibility: '호환성 — 다크 플레이리스트 카드, 키워드 히트맵',
    chat: '채팅 — 실시간 타이핑, AI 코칭 칩',
    buttons: '버튼 시스템 — variants × sizes × 키워드 칩',
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          앱 UI 인터랙션 시연
        </Typography>
        <Typography variant="body2" color="text.secondary">
          sometimes-app 실제 컴포넌트 디자인 토큰 기반 인터랙티브 시연 — 클릭하여 직접 체험 가능
        </Typography>
      </Box>

      {/* 탭 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {SCREENS.map(screen => (
          <Chip
            key={screen.id}
            label={screen.label}
            onClick={() => setActiveScreen(screen.id)}
            variant={activeScreen === screen.id ? 'filled' : 'outlined'}
            sx={{
              bgcolor: activeScreen === screen.id ? '#7A4AE2' : 'transparent',
              color: activeScreen === screen.id ? '#fff' : '#7A4AE2',
              borderColor: '#7A4AE2',
              fontWeight: 600,
              '&:hover': { bgcolor: activeScreen === screen.id ? '#6B3FD4' : '#F7F3FF' },
            }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 폰 모형 */}
        <Box sx={{ flexShrink: 0 }}>
          {/* 폰 외형 */}
          <Box sx={{
            width: 340, height: 680,
            borderRadius: '40px',
            bgcolor: '#1a1a1a',
            p: '10px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3), inset 0 0 0 2px #333',
            position: 'relative',
          }}>
            {/* 노치 */}
            <Box sx={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              width: 80, height: 24, bgcolor: '#1a1a1a', borderRadius: '0 0 12px 12px',
              zIndex: 10,
            }} />
            {/* 화면 */}
            <Box sx={{
              width: '100%', height: '100%',
              borderRadius: '32px',
              overflow: 'hidden',
              bgcolor: '#fff',
              position: 'relative',
            }}>
              {renderScreen()}
            </Box>
          </Box>
          {/* 측면 버튼 */}
          <Box sx={{ position: 'absolute', right: -6, top: 120, width: 4, height: 40, bgcolor: '#333', borderRadius: 2 }} />
        </Box>

        {/* 설명 패널 */}
        <Box sx={{ flex: 1, minWidth: 280 }}>
          {/* 현재 화면 설명 */}
          <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {SCREENS.find(s => s.id === activeScreen)?.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {screenLabels[activeScreen]}
            </Typography>
          </Box>

          {/* 인터랙션 가이드 */}
          <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              인터랙션 가이드
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {activeScreen === 'home' && [
                '숫자 카운터가 애니메이션으로 올라감',
                '프로필 사진 카드 — 실제 앱과 동일한 레이아웃',
              ].map((item, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1 }}>
                  <span style={{ color: '#7A4AE2', fontWeight: 700 }}>•</span> {item}
                </Typography>
              ))}
              {activeScreen === 'match' && [
                '좋아요 버튼 클릭 → 상태 토글',
                'Shimmer 애니메이션 (매 3초)',
              ].map((item, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1 }}>
                  <span style={{ color: '#7A4AE2', fontWeight: 700 }}>•</span> {item}
                </Typography>
              ))}
              {activeScreen === 'compatibility' && [
                '플레이리스트 카드 클릭 → 하단 상세 모달',
                '진행바 애니메이션 (로딩 시)',
                '키워드 히트맵 — ★ 공유 키워드 강조',
              ].map((item, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1 }}>
                  <span style={{ color: '#7A4AE2', fontWeight: 700 }}>•</span> {item}
                </Typography>
              ))}
              {activeScreen === 'chat' && [
                '메시지 입력 후 Enter 또는 전송 버튼',
                '상대방 타이핑 인디케이터 (bounce 애니메이션)',
                '코칭 칩 클릭 → 입력창에 자동 삽입',
              ].map((item, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1 }}>
                  <span style={{ color: '#7A4AE2', fontWeight: 700 }}>•</span> {item}
                </Typography>
              ))}
              {activeScreen === 'buttons' && [
                '버튼 클릭 → scale(0.97) 피드백',
                '키워드 칩 클릭 → 선택/해제 토글',
                '6가지 variant · 4가지 size 확인',
              ].map((item, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1 }}>
                  <span style={{ color: '#7A4AE2', fontWeight: 700 }}>•</span> {item}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* 디자인 토큰 */}
          <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              디자인 토큰
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {[
                { name: 'brand.primary', color: '#7A4AE2' },
                { name: 'brand.cta', color: '#3871FF' },
                { name: 'brand.accent', color: '#A892D7' },
                { name: 'surface.secondary', color: '#F7F3FF' },
                { name: 'state.attention', color: '#F70A8D' },
                { name: 'state.success', color: '#37DA1A' },
              ].map(token => (
                <Box key={token.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: token.color, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    {token.name}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled', ml: 'auto' }}>
                    {token.color}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
