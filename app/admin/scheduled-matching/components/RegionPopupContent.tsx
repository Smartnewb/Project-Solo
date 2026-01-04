'use client';

import type { MatchingPoolRegionStats } from '@/types/admin';

interface RegionPopupContentProps {
  region: MatchingPoolRegionStats;
}

export default function RegionPopupContent({ region }: RegionPopupContentProps) {
  const chatTrendValue = parseFloat(region.matchingStats.matchToChatTrend.replace(/[+%]/g, ''));
  const chatTrendIsPositive = chatTrendValue >= 0;

  const mutualTrendValue = parseFloat(region.matchingStats.mutualLikeTrend.replace(/[+%]/g, ''));
  const mutualTrendIsPositive = mutualTrendValue >= 0;

  const formatGenderRatio = (ratio: number | null): string => {
    if (ratio === null) return 'N/A';
    return `${ratio.toFixed(2)}:1`;
  };

  return (
    <div style={{ padding: '4px 0' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>
        {region.regionName}
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <StatItem label="총 유저" value={region.users.total.toLocaleString()} />
        <StatItem label="성비 (남/여)" value={formatGenderRatio(region.users.genderRatio)} />
        <StatItem label="남성" value={region.users.male.toLocaleString()} color="#3B82F6" />
        <StatItem label="여성" value={region.users.female.toLocaleString()} color="#EC4899" />
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>상호 좋아요율</span>
          <span style={{ fontWeight: 600 }}>
            {(region.matchingStats.mutualLikeRate * 100).toFixed(1)}%
          </span>
          <TrendBadge value={region.matchingStats.mutualLikeTrend} isPositive={mutualTrendIsPositive} />
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          좋아요 {region.matchingStats.totalLikes}건 중{' '}
          {region.matchingStats.mutualLikes}건 상호
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>채팅 전환율</span>
          <span style={{ fontWeight: 600 }}>
            {(region.matchingStats.matchToChatRate * 100).toFixed(1)}%
          </span>
          <TrendBadge value={region.matchingStats.matchToChatTrend} isPositive={chatTrendIsPositive} />
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          매칭 {region.matchingStats.totalMatches}건 중{' '}
          {region.matchingStats.chatConversions}건 전환
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          피크 시간대
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {region.hourlyActivity.peakHours.map((hour) => (
            <span
              key={hour}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                fontWeight: 500,
              }}
            >
              {hour}시
            </span>
          ))}
        </div>
      </div>

      {region.universities.topUniversities.length > 0 && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            상위 대학교
          </div>
          {region.universities.topUniversities.slice(0, 3).map((uni, idx) => (
            <div
              key={uni.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '4px',
              }}
            >
              <span>
                {idx + 1}. {uni.name}
              </span>
              <span style={{ color: '#6b7280' }}>{uni.count}명</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  color?: string;
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: color || 'inherit' }}>{value}</div>
    </div>
  );
}

interface TrendBadgeProps {
  value: string;
  isPositive: boolean;
}

function TrendBadge({ value, isPositive }: TrendBadgeProps) {
  return (
    <span
      style={{
        fontSize: '12px',
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: isPositive ? '#dcfce7' : '#fee2e2',
        color: isPositive ? '#16a34a' : '#dc2626',
        fontWeight: 500,
      }}
    >
      {value}
    </span>
  );
}
