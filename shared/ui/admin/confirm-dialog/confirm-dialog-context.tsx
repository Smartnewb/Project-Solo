'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

interface ConfirmDialogContextValue {
  state: ConfirmState;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

const defaultState: ConfirmState = {
  open: false,
  message: '',
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>(defaultState);
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current(true);
    setState(defaultState);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current(false);
    setState(defaultState);
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ state, confirm, handleConfirm, handleCancel }}>
      {children}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return ctx.confirm;
}

export function useConfirmDialogState() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirmDialogState must be used within ConfirmDialogProvider');
  return ctx;
}
