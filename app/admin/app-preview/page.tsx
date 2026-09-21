'use client';

import { Box, Typography, Chip } from '@mui/material';
import { useState, useEffect, useRef, useCallback } from 'react';

// ─── 실제 앱 디자인 토큰 ──────────────────────────────────────────
const C = {
  brandPrimary: '#ff385c',
  brandAccent: '#A892D7',
  brandLight: '#ffd1da',
  surfaceBg: '#FFFFFF',
  surfaceSecondary: '#f7f7f7',   // 대기화면 bg
  surfaceTertiary: '#f7f7f7',
  borderCard: '#E5E8EB',
  textPrimary: '#000000',
  textSecondary: '#333333',
  textMuted: '#7C7C7C',
  textDisabled: '#AEAEAE',
  textInverse: '#FFFFFF',
  stateOnline: '#37DA1A',
  stateError: '#E8586D',
};

const SCREENS = [
  { id: 'home-match', label: '홈 (매칭 중)' },
  { id: 'home-waiting', label: '홈 (대기 중)' },
  { id: 'chat-list', label: '채팅 목록' },
  { id: 'chat-room', label: '채팅방' },
  { id: 'buttons', label: '버튼/칩' },
] as const;
type ScreenId = (typeof SCREENS)[number]['id'];

// ─── 공통: 상태바 ────────────────────────────────────────────────
function StatusBar() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 4px', background: C.surfaceBg }}>
      <span style={{ fontSize: 12, fontWeight: 700 }}>9:41</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
        {[4, 6, 8, 10].map((h, i) => <div key={i} style={{ width: 3, height: h, background: '#000', borderRadius: 1, opacity: i < 3 ? 1 : 0.25 }} />)}
        <svg width="15" height="11" viewBox="0 0 15 11" style={{ marginLeft: 2 }}>
          <rect x="0" y="3" width="3" height="8" rx="1" fill="#000"/>
          <rect x="4" y="2" width="3" height="9" rx="1" fill="#000"/>
          <rect x="8" y="1" width="3" height="10" rx="1" fill="#000"/>
          <rect x="12" y="0" width="3" height="11" rx="1" fill="#000" opacity="0.25"/>
        </svg>
      </div>
    </div>
  );
}

// ─── 공통: sometime 로고 헤더 ─────────────────────────────────────
function SometimeHeader({ rightContent }: { rightContent?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6px 16px 10px', background: C.surfaceBg, position: 'relative' }}>
      {/* sometime 로고 텍스트 (실제 앱은 이미지지만 텍스트로 표현) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <svg width="108" height="22" viewBox="0 0 108 22">
          <text x="0" y="17" fontFamily="-apple-system, sans-serif" fontSize="17" fontWeight="800" fill={C.brandPrimary}>sometime</text>
        </svg>
      </div>
      {rightContent && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
          {rightContent}
        </div>
      )}
    </div>
  );
}

// ─── 공통: 5탭 하단 네비게이션 ───────────────────────────────────
function BottomNav({ active }: { active: 'home' | 'community' | 'chat' | 'moment' | 'my' }) {
  const tabs = [
    {
      id: 'home', label: '홈',
      icon: (on: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" fill={on ? C.brandPrimary : 'none'} strokeLinejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke={on ? '#fff' : '#AEAEAE'} strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      id: 'community', label: '커뮤니티',
      icon: (on: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" fill={on ? `${C.brandPrimary}30` : 'none'}/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'chat', label: '채팅',
      icon: (on: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" fill={on ? `${C.brandPrimary}20` : 'none'} strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'moment', label: '모먼트',
      icon: (on: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" fill={on ? `${C.brandPrimary}15` : 'none'}/>
          <path d="M12 8v4l3 3" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'my', label: 'MY',
      icon: (on: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" fill={on ? `${C.brandPrimary}20` : 'none'}/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={on ? C.brandPrimary : '#AEAEAE'} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ] as const;

  return (
    <div style={{ borderTop: `1px solid ${C.borderCard}`, background: C.surfaceBg, display: 'flex', paddingTop: 10, paddingBottom: 20, flexShrink: 0 }}>
      {tabs.map(tab => {
        const on = tab.id === active;
        return (
          <div key={tab.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
            {tab.icon(on)}
            <span style={{ fontSize: 10, color: on ? C.brandPrimary : C.textDisabled, fontWeight: on ? 700 : 400 }}>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Like Collapse Strip ─────────────────────────────────────────
function LikeCollapseStrip() {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState([false, false, false, false]);

  useEffect(() => {
    const t1 = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    visible.forEach((_, i) => {
      setTimeout(() => {
        setVisible(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 150);
    });
  }, [loaded]);

  const avatarColors = ['#e8c4f0', '#c4d8f0', '#f0c4c4', '#c4f0d8'];

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      {/* 보라 그라데이션 배경 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(177,144,249,1), rgba(177,144,249,0))', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* 블러 아바타 스택 */}
        <div style={{ display: 'flex', position: 'relative', height: 32 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              position: i === 0 ? 'relative' : 'absolute',
              left: i === 0 ? 0 : i * 22,
              width: 32, height: 32, borderRadius: '50%',
              border: '2px solid white',
              background: avatarColors[i],
              backdropFilter: 'blur(4px)',
              overflow: 'hidden',
              zIndex: 4 - i,
              opacity: visible[i] ? 1 : 0,
              transform: visible[i] ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.6)',
              transition: 'all 0.35s ease',
            }}>
              <div style={{ width: '100%', height: '100%', backdropFilter: 'blur(6px)', background: `${avatarColors[i]}88` }} />
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 70, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s 0.8s' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>지은님이 회원님에게 좋아요를 보냈어요</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" stroke={C.brandPrimary} strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

// ─── 매칭 카드 (파트너 있음) ─────────────────────────────────────
function MatchCard({ onPress }: { onPress: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ h: 11, m: 23, s: 47 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) return prev;
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      onClick={onPress}
      style={{
        borderRadius: 20, overflow: 'hidden', position: 'relative',
        aspectRatio: '1', cursor: 'pointer',
        background: 'linear-gradient(145deg, #e2c8f5, #f5c8e2, #c8d8f5)',
      }}
    >
      {/* 파트너 사진 자리 (그라데이션으로 표현) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, #f5e8ff 0%, #d4a8f0 40%, #a855d4 100%)',
      }}>
        {/* 인물 실루엣 */}
        <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 72, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>👩</div>
        </div>
      </div>

      {/* 하단 그라데이션 오버레이 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '46%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* 상단 타이머 */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* 구분자 박스 */}
          {[{ v: pad(timeLeft.h) }, { v: ':' }, { v: pad(timeLeft.m) }, { v: ':' }, { v: pad(timeLeft.s) }].map((seg, i) => (
            seg.v === ':' ? (
              <span key={i} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 700, lineHeight: 1, paddingBottom: 2 }}>:</span>
            ) : (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.45)', borderRadius: 5,
                padding: '2px 5px', color: '#fff', fontSize: 14, fontWeight: 700,
                backdropFilter: 'blur(4px)',
              }}>{seg.v}</div>
            )
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 3, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>이 인연을 볼 수 있는 시간</div>
      </div>

      {/* 최근 접속 배지 (우상단) */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: C.brandPrimary, borderRadius: 4,
        padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>최근 접속</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>방금 전</span>
      </div>

      {/* 파트너 정보 (하단) */}
      <div style={{ position: 'absolute', bottom: 16, left: 12, right: 54, zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
          23세
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 500, textShadow: '0 1px 8px rgba(0,0,0,0.85)' }}>#INFJ</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 500, textShadow: '0 1px 8px rgba(0,0,0,0.85)' }}>#한밭대학교</span>
          {/* 인증 없음 아이콘 */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M1 1l22 22M6.5 6.5C4.9 7.9 4 9.9 4 12c0 4.4 3.6 8 8 8 2.1 0 4-.8 5.5-2.2M9 3.5C9.9 3.2 10.9 3 12 3c4.4 0 8 3.6 8 8 0 1.1-.2 2.1-.5 3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
          {['차분한 연애', '느리게 천천히'].map(tag => (
            <span key={tag} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 11, padding: '2px 7px', fontSize: 10, color: '#fff' }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* "더 보기" 사이드 버튼 */}
      <div style={{
        position: 'absolute', right: 0, bottom: 52, zIndex: 10,
        background: C.brandPrimary, borderRadius: '8px 0 0 8px',
        padding: '8px 6px 8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
        <span style={{ color: '#fff', fontSize: 10, fontWeight: 500, writingMode: 'vertical-rl', letterSpacing: 1 }}>더 보기</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

// ─── 대기 화면 ────────────────────────────────────────────────────
function WaitingCard() {
  const [time, setTime] = useState({ d: 2, h: 14, m: 33, s: 20 });

  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { d, h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        return { d, m, h, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div style={{
      background: C.surfaceSecondary, borderRadius: 20,
      padding: '22px 20px 16px', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 200,
    }}>
      <div style={{ maxWidth: '76%' }}>
        {/* 모래시계 이모지 대신 SVG */}
        <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 14 }}>⏳</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4 }}>지은님,</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4 }}>다음 매칭을 기다리는 중이에요</div>
        </div>
      </div>

      <div style={{ maxWidth: '78%', marginTop: 20 }}>
        {/* 타이머 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'D', val: `-${time.d}` },
            { label: '', val: '-' },
            ...`${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`.split('').map(c => ({ label: '', val: c })),
          ].filter((_, i) => i < 12).map((seg, i) => (
            seg.val === '-' && seg.label === '' ? (
              <span key={i} style={{ color: C.textMuted, fontSize: 20, fontWeight: 700 }}>-</span>
            ) : (
              <div key={i} style={{
                background: '#fff', borderRadius: 8, padding: '4px 8px',
                fontSize: 20, fontWeight: 700, color: C.textPrimary,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                minWidth: seg.val === ':' ? 'auto' : 28, textAlign: 'center',
              }}>{seg.val}</div>
            )
          ))}
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4 }}>조금만 기다려주세요!</div>
        <div style={{ fontSize: 14, color: C.brandAccent, lineHeight: 1.4, marginTop: 4 }}>
          매주 목·일요일에 새 인연이 도착해요
        </div>
      </div>

      {/* 여우 마스코트 자리 */}
      <div style={{
        position: 'absolute', right: -12, bottom: -8,
        fontSize: 72, opacity: 0.4, transform: 'rotate(-10deg)',
        lineHeight: 1,
      }}>🦊</div>

      {/* 사이드 버튼 */}
      <div style={{
        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
        background: C.brandPrimary, borderRadius: '8px 0 0 8px',
        padding: '12px 6px',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

// ─── 홈 화면 (매칭 중) ───────────────────────────────────────────
function HomeMatchScreen() {
  const [showPartnerDetail, setShowPartnerDetail] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surfaceBg, fontFamily: '-apple-system, "Noto Sans KR", sans-serif' }}>
      <StatusBar />
      <SometimeHeader rightContent={
        <>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.surfaceSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={C.textSecondary} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.surfaceSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            💎
          </div>
        </>
      }/>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Like Collapse */}
        <LikeCollapseStrip />

        {/* 매칭 카드 */}
        <MatchCard onPress={() => setShowPartnerDetail(true)} />
      </div>

      <BottomNav active="home" />

      {/* 파트너 상세 미니 모달 */}
      {showPartnerDetail && (
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}
          onClick={() => setShowPartnerDetail(false)}
        >
          <div style={{ width: '100%', background: C.surfaceBg, borderRadius: '24px 24px 0 0', padding: '20px 20px 32px' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #e2c8f5, #f5c8e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>👩</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>23세</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>한밭대학교 · INFJ</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {['차분한 연애', '느리게 천천히'].map(t => (
                    <span key={t} style={{ background: C.surfaceTertiary, borderRadius: 999, padding: '3px 8px', fontSize: 10, color: C.brandPrimary }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* 좋아요 버튼 */}
            <div style={{
              width: '100%', height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #9B6DFF, #ff385c, #e00b41)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
              border: '3px solid #e00b41', overflow: 'hidden', position: 'relative',
            }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>💜 좋아요 보내기</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 홈 화면 (대기 중) ───────────────────────────────────────────
function HomeWaitingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surfaceBg, fontFamily: '-apple-system, "Noto Sans KR", sans-serif' }}>
      <StatusBar />
      <SometimeHeader rightContent={
        <>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.surfaceSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={C.textSecondary} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.surfaceSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            💎
          </div>
        </>
      } />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* None Like Banner */}
        <div style={{ background: C.surfaceSecondary, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={C.brandPrimary} strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <span style={{ fontSize: 12, color: C.textSecondary }}>아직 좋아요가 없어요. 먼저 좋아요를 보내보세요!</span>
        </div>

        {/* 대기 카드 */}
        <WaitingCard />
      </div>

      <BottomNav active="home" />
    </div>
  );
}

// ─── 채팅 목록 ────────────────────────────────────────────────────
function ChatListScreen() {
  const rooms = [
    { name: '지은', univ: '한밭대학교', last: '오늘 뭐 해요? 😊', time: '방금 전', unread: 2, avatar: '👩' },
    { name: '민준', univ: '충남대학교', last: '알겠어요! 그럼 거기서 봬요', time: '12분 전', unread: 0, avatar: '👨' },
    { name: '수연', univ: '배재대학교', last: '저도 여행 진짜 좋아해요', time: '1시간 전', unread: 0, avatar: '👩‍🦱' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surfaceBg, fontFamily: '-apple-system, "Noto Sans KR", sans-serif' }}>
      <StatusBar />
      <div style={{ padding: '6px 16px 12px', fontWeight: 800, fontSize: 18 }}>채팅</div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rooms.map((room, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 16px', alignItems: 'center', borderBottom: `1px solid ${C.borderCard}`, cursor: 'pointer' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #e8d5ff, #ffd5e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
              {room.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{room.name}</span>
                  <span style={{ fontSize: 11, color: C.textDisabled }}>{room.univ}</span>
                </div>
                <span style={{ fontSize: 11, color: C.textDisabled }}>{room.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.last}</span>
                {room.unread > 0 && (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.stateError, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{room.unread}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="chat" />
    </div>
  );
}

// ─── 채팅방 ───────────────────────────────────────────────────────
function ChatRoomScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: '안녕하세요 반갑습니다 😊', mine: false, time: '오후 3:12' },
    { id: 2, text: '안녕하세요~ 저도 반가워요!', mine: true, time: '오후 3:13' },
    { id: 3, text: '프로필 보니까 여행 좋아하시더라고요', mine: false, time: '오후 3:14' },
    { id: 4, text: '맞아요! 최근에 제주도 다녀왔는데 너무 좋았어요', mine: true, time: '오후 3:15' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const send = () => {
    if (!input.trim()) return;
    const msg = { id: Date.now(), text: input, mine: true, time: '오후 3:' + (16 + messages.length) };
    setMessages(p => [...p, msg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(p => [...p, { id: Date.now(), text: '오 정말요? 어디가 제일 좋으셨어요?', mine: false, time: '오후 3:' + (17 + p.length) }]);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surfaceBg, fontFamily: '-apple-system, "Noto Sans KR", sans-serif' }}>
      {/* 헤더 */}
      <div style={{ background: C.surfaceBg, borderBottom: `1px solid ${C.borderCard}`, padding: '46px 16px 10px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={C.textPrimary} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        {/* 프로필 사진 + 이름 */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #e8d5ff, #ffd5e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginLeft: 12, flexShrink: 0 }}>👩</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3 }}>지은</div>
            <div style={{ fontSize: 11, color: C.textDisabled }}>한밭대학교&nbsp; 컴퓨터공학과</div>
          </div>
        </div>
        {/* ⋮ */}
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="4" height="18" viewBox="0 0 4 18">
            {[1, 9, 17].map(cy => <circle key={cy} cx="2" cy={cy} r="1.5" fill={C.textSecondary}/>)}
          </svg>
        </div>
      </div>

      {/* 새 매칭 배너 */}
      <div style={{ margin: '8px 12px', border: `1px solid ${C.brandPrimary}`, borderRadius: 10, padding: '8px 12px', textAlign: 'center', background: '#fff' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          서로 <span style={{ color: C.brandPrimary, fontWeight: 800 }}>지은</span>님과 매칭됐어요! 💌
        </div>
        <div style={{ fontSize: 11, color: C.textDisabled, marginTop: 1 }}>서로 관심있어 해요</div>
      </div>

      {/* 메시지 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.mine ? 'flex-end' : 'flex-start', gap: 6, alignItems: 'flex-end' }}>
            {!msg.mine && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #e8d5ff, #ffd5e8)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>👩</div>
            )}
            <div style={{ maxWidth: '68%' }}>
              <div style={{
                background: msg.mine ? `linear-gradient(135deg, ${C.brandPrimary}, #e00b41)` : '#F2F3F5',
                color: msg.mine ? '#fff' : C.textPrimary,
                borderRadius: msg.mine ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: 10, color: C.textDisabled, textAlign: msg.mine ? 'right' : 'left', marginTop: 3 }}>{msg.time}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #e8d5ff, #ffd5e8)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👩</div>
            <div style={{ background: '#F2F3F5', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 0.25, 0.5].map((delay, i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.textDisabled, animation: `bounce 1s ${delay}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 입력창 */}
      <div style={{ padding: '8px 12px 24px', background: C.surfaceBg, borderTop: `1px solid ${C.borderCard}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="메시지를 입력하세요..."
          style={{ flex: 1, border: `1px solid ${C.borderCard}`, borderRadius: 999, padding: '9px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#F8F9FA' }}
        />
        <button onClick={send} style={{ width: 38, height: 38, borderRadius: '50%', background: C.brandPrimary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}

// ─── 버튼/칩 시스템 ──────────────────────────────────────────────
function ButtonsScreen() {
  const [selected, setSelected] = useState<string[]>(['여행', 'INFJ']);
  const chips = ['INFJ', 'ENFP', '여행', '독서', '카페투어', '요리', '영화', '음악'];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '48px 16px 24px', fontFamily: '-apple-system, "Noto Sans KR", sans-serif' }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>버튼 시스템</div>

      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 10 }}>VARIANTS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {[
          { label: '확인', bg: C.brandPrimary, color: '#fff', border: C.brandPrimary },
          { label: '좋아요 보내기', bg: 'linear-gradient(135deg,#9B6DFF,#ff385c,#e00b41)', color: '#fff', border: '#e00b41', isGrad: true },
          { label: '나중에', bg: '#F8F9FA', color: C.textMuted, border: '#E4E2E2', bw: 2 },
          { label: '더보기', bg: 'transparent', color: C.brandPrimary, border: C.brandPrimary },
          { label: '취소', bg: '#fff', color: C.brandPrimary, border: C.brandPrimary },
          { label: '닫기', bg: '#fff', color: C.textSecondary, border: C.borderCard },
        ].map((v, i) => (
          <button key={i} style={{
            width: '100%', height: 50, borderRadius: 9999, cursor: 'pointer',
            background: v.isGrad ? undefined : v.bg,
            backgroundImage: v.isGrad ? v.bg : undefined,
            color: v.color, border: `${v.bw ?? 1}px solid ${v.border}`,
            fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
            transition: 'opacity 0.1s',
          }}
            onMouseDown={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseUp={e => (e.currentTarget.style.opacity = '1')}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 10 }}>SIZES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {[{ h: 60, label: 'Large' }, { h: 50, label: 'Medium' }, { h: 34, label: 'Small' }, { h: 41, label: 'Chip' }].map(s => (
          <div key={s.h} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: C.textDisabled, width: 50 }}>{s.label} {s.h}px</span>
            <button style={{ flex: 1, height: s.h, borderRadius: 9999, background: C.brandPrimary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>버튼</button>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 10 }}>KEYWORD CHIPS</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map(chip => {
          const on = selected.includes(chip);
          return (
            <button key={chip} onClick={() => setSelected(p => on ? p.filter(c => c !== chip) : [...p, chip])} style={{
              height: 41, padding: '0 14px', borderRadius: 9999,
              background: on ? C.brandPrimary : '#F8F9FA',
              color: on ? '#fff' : C.textMuted,
              border: `${on ? 1 : 2}px solid ${on ? C.brandPrimary : '#E4E2E2'}`,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}>
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────
export default function AppPreviewPage() {
  const [active, setActive] = useState<ScreenId>('home-match');

  const render = () => {
    switch (active) {
      case 'home-match': return <HomeMatchScreen />;
      case 'home-waiting': return <HomeWaitingScreen />;
      case 'chat-list': return <ChatListScreen />;
      case 'chat-room': return <ChatRoomScreen />;
      case 'buttons': return <ButtonsScreen />;
    }
  };

  const notes: Record<ScreenId, string[]> = {
    'home-match': ['매칭 카드: 파트너 사진이 카드 전체를 채움', '상단 타이머 — 실시간 카운트다운', '우상단 최근 접속 배지 (보라색 pill)', '하단 그라데이션 오버레이 + 나이/MBTI/학교/연애스타일', '우측 "더 보기 →" 사이드 버튼', '카드 클릭 → 파트너 상세 + 좋아요 버튼 shimmer', 'Like Collapse: 블러 아바타 순차 등장 + 보라 그라데이션'],
    'home-waiting': ['`surface.secondary: #f7f7f7` 배경', 'D-2 카운트다운 타이머', '여우 마스코트 우측 하단 반투명', '매주 목·일요일 매칭 안내'],
    'chat-list': ['채팅 목록: 아바타 + 이름 + 대학교', '읽지않은 메시지 빨간 뱃지', '마지막 메시지 미리보기'],
    'chat-room': ['헤더: 뒤로 + 프로필사진/이름/학과 + ⋮', '새 매칭 배너 (borderColor: brand.primary)', '메시지: 보라 그라데이션 (내) vs 회색 (상대)', '타이핑 인디케이터 bounce 애니메이션', 'Enter로 전송'],
    'buttons': ['6 variants 탭 피드백', '4 size (60/50/34/41px)', '키워드 칩 선택 토글'],
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>앱 UI 인터랙션 시연</Typography>
        <Typography variant="body2" color="text.secondary">실제 sometimes-app 컴포넌트 구조 · 디자인 토큰 · 레이아웃 기반</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {SCREENS.map(s => (
          <Chip key={s.id} label={s.label} onClick={() => setActive(s.id)} variant={active === s.id ? 'filled' : 'outlined'}
            sx={{ bgcolor: active === s.id ? '#ff385c' : 'transparent', color: active === s.id ? '#fff' : '#ff385c', borderColor: '#ff385c', fontWeight: 600, '&:hover': { bgcolor: active === s.id ? '#e00b41' : '#f7f7f7' } }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 폰 모형 */}
        <Box sx={{ flexShrink: 0, width: 340, height: 700, borderRadius: '40px', bgcolor: '#1a1a1a', p: '10px', boxShadow: '0 24px 64px rgba(0,0,0,0.35), inset 0 0 0 2px #333', position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 80, height: 24, bgcolor: '#1a1a1a', borderRadius: '0 0 14px 14px', zIndex: 10 }} />
          <Box sx={{ width: '100%', height: '100%', borderRadius: '32px', overflow: 'hidden', bgcolor: '#fff', position: 'relative' }}>
            {render()}
          </Box>
        </Box>

        {/* 설명 */}
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 2, mb: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{SCREENS.find(s => s.id === active)?.label}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {notes[active].map((n, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1 }}>
                  <span style={{ color: '#ff385c', fontWeight: 700, flexShrink: 0 }}>•</span>{n}
                </Typography>
              ))}
            </Box>
          </Box>

          <Box sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>주요 디자인 토큰</Typography>
            {[
              { name: 'brand.primary', hex: '#ff385c' },
              { name: 'brand.accent', hex: '#A892D7' },
              { name: 'brand.light', hex: '#ffd1da' },
              { name: 'surface.secondary', hex: '#f7f7f7' },
              { name: 'border.card', hex: '#E5E8EB' },
              { name: 'state.online', hex: '#37DA1A' },
              { name: 'state.error', hex: '#E8586D' },
            ].map(t => (
              <Box key={t.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.6 }}>
                <Box sx={{ width: 18, height: 18, borderRadius: 0.5, bgcolor: t.hex, border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{t.name}</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled', ml: 'auto' }}>{t.hex}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
