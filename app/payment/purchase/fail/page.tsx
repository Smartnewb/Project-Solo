'use client';

import { useRedirectTossPayment } from "@/features/toss-payment";
import { Button } from "@/shared/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { back } = useRedirectTossPayment();
  
  useEffect(() => {
    const code = searchParams?.get('code');
    const message = searchParams?.get('message');
    const orderId = searchParams?.get('orderId');

    if (!code || !message) {
      alert('결제 오류 정보가 잘못되었습니다.');
      router.push('/');
      return;
    }

    console.log({ code, message, orderId });
  }, [searchParams]);

  return (
    <div className="h-screen flex flex-col justify-center">

    <div className="flex flex-col justify-center">
      <h1 className="text-error text-2xl font-bold">결제 실패</h1>
      <p className="text-sm text-gray-500 mt-2 mb-4">
        {searchParams?.get('message') || '결제 처리 중 문제가 발생했습니다.'}
      </p>
      <Button 
        onClick={back} 
        variant="white" 
        size="xl" 
        className="w-full mb-2"
      >
        다시 시도하기
      </Button>
      <Button 
        onClick={() => router.push('/')} 
        variant="default" 
        size="xl" 
        className="w-full"
      >
        홈으로 돌아가기
      </Button>
    </div>
    </div>
  );
}
