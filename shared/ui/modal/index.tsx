import * as React from "react";
import { cn } from "@/shared/utils";
import { X } from "lucide-react"; // X 아이콘을 위해 lucide-react 사용

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, children, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <>
        {/* 오버레이 */}
        <div 
          className="fixed inset-0 bg-black/50 z-50" 
          onClick={onClose}
          aria-hidden="true"
        />
        {/* 모달 컨테이너 */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            ref={ref}
            className={cn(
              "relative bg-white max-h-[90vh] overflow-auto",
              "w-full max-w-lg rounded-xl border shadow-lg",
              "animate-in fade-in-0 zoom-in-95",
              className
            )}
            {...props}
          >
            {children}
          </div>
        </div>
      </>
    );
  }
);
Modal.displayName = "Modal";

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between border-b p-4 bg-white",
      className
    )}
    {...props}
  >
    <div className="font-semibold">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="rounded-full p-1 hover:bg-gray-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
));
ModalHeader.displayName = "ModalHeader";

const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 bg-white", className)}
    {...props}
  />
));
ModalContent.displayName = "ModalContent";

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-2 border-t p-4 bg-white",
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

export { Modal, ModalHeader, ModalContent, ModalFooter }; 