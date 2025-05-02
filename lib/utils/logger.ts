// 로그 레벨 타입
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 로그 설정
interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

// 기본 설정
const defaultConfig: LoggerConfig = {
  enabled: process.env.NODE_ENV === 'development',
  level: 'info'
};

// 로그 레벨 우선순위
const logLevelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// 로거 클래스
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // 로그 레벨 설정
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  // 로그 활성화/비활성화
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  // 로그 접두사 설정
  setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  // 로그 출력 여부 확인
  private shouldLog(level: LogLevel): boolean {
    return (
      this.config.enabled &&
      logLevelPriority[level] >= logLevelPriority[this.config.level]
    );
  }

  // 로그 메시지 포맷
  private formatMessage(message: string): string {
    return this.config.prefix ? `[${this.config.prefix}] ${message}` : message;
  }

  // 디버그 로그
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(message), ...args);
    }
  }

  // 정보 로그
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message), ...args);
    }
  }

  // 경고 로그
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message), ...args);
    }
  }

  // 에러 로그
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(message), ...args);
    }
  }

  // 그룹 로그 시작
  group(label: string): void {
    if (this.config.enabled) {
      console.group(this.formatMessage(label));
    }
  }

  // 그룹 로그 종료
  groupEnd(): void {
    if (this.config.enabled) {
      console.groupEnd();
    }
  }

  // 시간 측정 시작
  time(label: string): void {
    if (this.config.enabled) {
      console.time(this.formatMessage(label));
    }
  }

  // 시간 측정 종료
  timeEnd(label: string): void {
    if (this.config.enabled) {
      console.timeEnd(this.formatMessage(label));
    }
  }
}

// 기본 로거 인스턴스
export const logger = new Logger();

// 사용자 로거 인스턴스
export const userLogger = new Logger({ prefix: 'USER' });

// 어드민 로거 인스턴스
export const adminLogger = new Logger({ prefix: 'ADMIN' });

// API 로거 인스턴스
export const apiLogger = new Logger({ prefix: 'API' });

// 기본 내보내기
export default logger;
