// 전역 이벤트 버스 생성 (등급 변경 이벤트 처리용)
export const appearanceGradeEventBus = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  publish() {
    this.listeners.forEach((listener) => listener());
  },
};
