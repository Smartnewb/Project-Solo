import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from './index';

interface ModalConfig {
  id: string;
  component: React.ReactNode;
  onClose?: () => void;
}

interface ModalContextType {
  showModal: (config: Omit<ModalConfig, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAll: () => void;
}

export const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const showModal = useCallback((config: Omit<ModalConfig, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setModals((prev) => [...prev, { ...config, id }]);
    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => {
      const modal = prev.find((m) => m.id === id);
      if (modal?.onClose) modal.onClose();
      return prev.filter((modal) => modal.id !== id);
    });
  }, []);

  const closeAll = useCallback(() => {
    modals.forEach((modal) => modal.onClose?.());
    setModals([]);
  }, [modals]);

  return (
    <ModalContext.Provider value={{ showModal, closeModal, closeAll }}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <>
            {modals.map((modal, index) => (
              <Modal
                key={modal.id}
                isOpen={true}
                onClose={() => closeModal(modal.id)}
                style={{ zIndex: 1000 + index }}
              >
                {modal.component}
              </Modal>
            ))}
          </>,
          document.body
        )}
    </ModalContext.Provider>
  );
} 