'use client';

import { MobileLayout } from "@/features/layouts";
import { useRedirectTossPayment } from "@/features/toss-payment";
import { Button } from "@/shared/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import SparklingHeart from '@/public/icon/sparkling-heart.svg';
import paymentApis from "@/features/payment/api";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { back } = useRedirectTossPayment();

  useEffect(() => {
    const orderId = searchParams?.get('orderId');
    const paymentKey = searchParams?.get('paymentKey');
    const amount = searchParams?.get('amount');

    if (!orderId || !paymentKey || !amount) {
      alert('결제 정보가 잘못되었습니다.');
      router.push('/');
      return;
    }
    (async () => {
      await paymentApis.pay({
        orderId,
        paymentKey,
        amount: Number(amount),
      });
    })();
  }, [searchParams]);

  return (
    <MobileLayout className="flex flex-col justify-center">
      <div className="flex gap-x-1.5">
        <h1 className="text-primary text-4xl font-bold">결제 성공</h1>
        <SparklingHeart />
      </div>

      <section className="flex flex-col mb-8">
      <p className="text-lg text-gray-700">결제가 성공적으로 완료되었어요.</p>
      <p className="text-lg text-gray-700">회원님의 재매칭을 수행할게요.</p>
      </section>
      <Button onClick={back} variant="default" size="xl" className="w-full">
        매칭현황으로 이동
      </Button>
    </MobileLayout>
  );
}
