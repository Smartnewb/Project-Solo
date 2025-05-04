import { useEffect, useCallback } from "react";
import { ModalHeader, ModalContent, ModalFooter } from "./index";
import { Button } from "../button";
import { useModal } from "@/shared/hooks/use-modal";
import { useTossPayments } from "@/features/toss-payment";

interface PaymentModalProps {
  amount: number;
  modalId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function PaymentModal({ amount, modalId, onSuccess, onError }: PaymentModalProps) {
  const { ready, requestPayment } = useTossPayments();
  const { close } = useModal();

  const handleClose = useCallback(() => {
    close(modalId);
  }, [close, modalId]);

  const handlePayment = async () => {
    try {
      await requestPayment(amount);
      onSuccess?.();
      handleClose();
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <>
      <ModalHeader onClose={handleClose}>결제하기</ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <div id="payment-method" className="min-h-[200px]" />
          <div id="agreement" className="min-h-[100px]" />
          <div className="text-sm text-gray-500">
            결제 금액: {amount.toLocaleString()}원
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
        >
          취소
        </Button>
        <Button
          onClick={handlePayment}
          disabled={!ready}
        >
          결제하기
        </Button>
      </ModalFooter>
    </>
  );
}