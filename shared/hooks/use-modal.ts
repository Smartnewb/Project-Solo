import { useContext, useCallback } from 'react';
import { ModalContext } from '../ui/modal/context';

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  const { showModal, closeModal, closeAll } = context;

  const open = useCallback((component: React.ReactNode, onClose?: () => void) => {
    return showModal({ component, onClose });
  }, [showModal]);

  return {
    open,
    close: closeModal,
    closeAll
  };
} 