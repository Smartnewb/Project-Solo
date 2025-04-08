'use client';

import MobileLayout from "@/features/layouts/mobile";
import { Payment } from "@/features/payment";
import { useRedirectTossPayment, useTossPayments } from "@/features/toss-payment";
import { Button } from "@/shared/ui/button";

export default function PaymentPage() {
  const { ready, requestPayment, updatePayAmount, isAgreed } = useTossPayments(2000);
  const { back } = useRedirectTossPayment();

  const purchase = async () => {
    try {
      await requestPayment('재매칭');
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <MobileLayout className="flex flex-col justify-center">
      <Payment.Product 
        name="연인 재매칭권"
        price={2000}
        count={1}
        description="연인 재매칭권 결제"
        className="px-4"
      />

      <div className="flex w-full flex-col">
        <div id="payment-method" className="min-h-[340px] w-full" />
        <div id="agreement" className="min-h-[100px] w-full" />
      </div>

      <div className="flex flex-col w-full gap-y-2">
        <Button onClick={purchase} variant="default" size="xl" className="w-full" disabled={!ready || !isAgreed}>
          결제하기
        </Button>
        <Button variant="white" size="xl" className="w-full" onClick={back}>
          이전으로
        </Button>
      </div>

    </MobileLayout>
  );
}
