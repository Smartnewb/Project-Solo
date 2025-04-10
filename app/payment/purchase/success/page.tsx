'use client';

import { Button } from "@/shared/ui/button";
import SparklingHeart from '@/public/icon/sparkling-heart.svg';
import { useRouteMemory } from "@/shared/hooks";

export default function SuccessPage() {
  const { back } = useRouteMemory();

  return (
    <div className="h-screen flex flex-col justify-center">
    <div className="flex flex-col justify-center">
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
    </div>
    </div>

  );
}
