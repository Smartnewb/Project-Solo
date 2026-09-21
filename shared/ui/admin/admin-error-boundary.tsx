'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await fetch('/api/admin/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack?.slice(0, 2000),
          componentStack: errorInfo.componentStack?.slice(0, 1000),
          url: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Silently fail - don't create error loops
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <h2 className="mb-2 text-xl font-semibold text-[#222222]">문제가 발생했습니다</h2>
            <p className="mb-4 text-[#3f3f3f]">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="min-h-12 rounded-lg bg-[#ff385c] px-6 py-[14px] text-sm font-medium text-white transition-colors hover:bg-[#e00b41]"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
