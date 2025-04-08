'use client';

import { MobileLayout } from "@/features/layouts";
import { useTossPayments } from "@/features/toss-payment";

export default function PaymentPage() {
  const { ready, requestPayment, updatePayAmount } = useTossPayments(2000);

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">결제하기</h1>
        <p className="text-sm text-gray-500">결제 금액: 2000원</p>
      </div>
  
      <div id="payment-method" className="min-h-[340px]" />
      <div id="agreement" className="min-h-[100px]" />
    </MobileLayout>
  );
}
