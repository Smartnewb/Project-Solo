/**
 * Vercel MCP (Multi-Cluster Provisioning) 설정 파일
 * 
 * 이 파일은 Vercel 배포 시 여러 리전에 애플리케이션을 배포하기 위한 설정을 정의합니다.
 * 자세한 내용은 https://vercel.com/docs/concepts/edge-network/regions 참조
 */

module.exports = {
  // 배포할 리전 목록
  regions: [
    'iad1', // Washington D.C., USA (East)
    'sfo1', // San Francisco, USA (West)
    'hnd1', // Tokyo, Japan
    'icn1', // Seoul, South Korea
    'sin1', // Singapore
    'fra1', // Frankfurt, Germany
  ],
  
  // 배포 설정
  settings: {
    // 각 리전별 최소 인스턴스 수
    minInstances: 1,
    
    // 각 리전별 최대 인스턴스 수
    maxInstances: 3,
    
    // 자동 스케일링 설정
    scaling: {
      enabled: true,
      // CPU 사용률이 80%를 초과하면 스케일 아웃
      cpuThreshold: 80,
      // 메모리 사용률이 80%를 초과하면 스케일 아웃
      memoryThreshold: 80
    }
  }
};
