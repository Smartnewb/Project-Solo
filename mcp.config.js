/**
 * Vercel MCP (Multi-Cluster Provisioning) 설정 파일
 *
 * 이 파일은 Vercel 배포 시 여러 리전에 애플리케이션을 배포하기 위한 설정을 정의합니다.
 * 자세한 내용은 https://vercel.com/docs/concepts/edge-network/regions 참조
 */

module.exports = {
  // 배포할 리전 목록 (주요 리전만 선택)
  regions: [
    'iad1', // Washington D.C., USA (East)
    'sfo1', // San Francisco, USA (West)
    'hnd1', // Tokyo, Japan
  ]
};
