'use client';

import MobileLayout from "@/features/layouts/mobile";
import { Payment } from "@/features/payment";
import { useLocalStorage, useRouteMemory } from "@/shared/hooks";
import { PaymentProduct } from "@/types/pay";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import { Counter } from "@/shared/ui";
import { useState } from "react";

type PaymentPayload = {
  identifier: PaymentProduct;
}

export default function PaymentPage() {
  const router = useRouter();
  const { back } = useRouteMemory();
  const [payload] = useLocalStorage<'redirect-payload', PaymentPayload>('redirect-payload', null);
  const [count, setCount] = useState(1);
  const [price, setPrice] = useState(2000);
  const [totalPrice, setTotalPrice] = useState(2000);

  const priceRender = totalPrice.toLocaleString();

  const purchase = async () => {
    if (!payload) {
      alert("결제 정보가 없습니다.");
      return back();
    }

    try {
      const paymentId = Payment.PortOne.createUniqueId();

      await Payment.Apis.saveHistory({
        orderId: paymentId,
        amount: totalPrice,
        orderName: "연인 재매칭권",
      });

      const payResult = await Payment.PortOne.pay({
        paymentId,
        totalAmount: totalPrice,
        orderName: "연인 재매칭권",
        payMethod: "CARD",
      });

      if (payResult?.code) {
        alert("결제가 실패하였습니다. 다시 시도해주세요.");
        return;
      }

      if (!payResult?.txId) {
        throw new Error("트랜잭션 아이디가 없습니다.");
      }

      await Payment.Apis.pay({
        orderId: paymentId,
        txId: payResult.txId,
      });

      router.push('/payment/purchase/success');
    } catch (error) {
      console.error(error);
    }
  }

  const updateCount = (value: number) => {
    setCount(value);
    setTotalPrice(price * value);
  };

  return (
    <MobileLayout className="flex flex-col justify-center">
      <Payment.Product
        name="연인 재매칭권"
        count={count}
        description="연인 재매칭권 결제"
        className="px-4"
      />

      <section className="flex flex-col gap-y-2 px-4 justify-center mt-4">
        <span className="text-gray-500 text-xl">구매할 수량을 선택해주세요.</span>
        <Counter
          size="lg"
          value={count}
          onChange={updateCount}
          min={1}
          max={30}
          step={1}
        />
      </section>

      <section className="flex gap-y-2 gap-x-2 justify-center mt-4 self-end mb-6">
        <span className="text-gray-500 text-2xl">총 결제금액</span>
        <span className="text-primary text-2xl font-bold">{priceRender}원</span>
      </section>

      <div className="flex flex-col w-full gap-y-2">
        <Button onClick={purchase} variant="default" size="xl" className="w-full">
          결제하기
        </Button>
        <Button variant="white" size="xl" className="w-full" onClick={back}>
          이전으로
        </Button>
      </div>

    </MobileLayout>
  );
}
