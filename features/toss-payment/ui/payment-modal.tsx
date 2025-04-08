'use client';

import { useTossPayments } from "../hooks/use-toss-payments";
import { ModalHeader, ModalContent, ModalFooter } from "@/shared/ui";
import { Button } from "@/shared/ui/button";

interface PaymentModalProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onClose: () => void;
}

export function PaymentModal({ amount, onSuccess, onError, onClose }: PaymentModalProps) {
  const { ready, requestPayment } = useTossPayments(2000);

  const handlePayment = async () => {
    try {
      await requestPayment();
      onSuccess?.();
      onClose();
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <>
      <ModalHeader onClose={onClose}>결제하기</ModalHeader>
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
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          variant="default"
          onClick={handlePayment}
          disabled={!ready}
        >
          결제하기
        </Button>
      </ModalFooter>
    </>
  );
} 