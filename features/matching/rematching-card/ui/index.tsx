import { Card, CardContent, CardHeader } from "@/shared/ui";
import { Counter } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { CheckIcon } from "lucide-react";
import SparklingHeart from "../../../../public/icon/sparkling-heart.svg";
import { useState } from "react"; 
import { useRouteMemory } from "@/shared/hooks";

const PRICE = 2000;

export default function RematchingCard() {
  const [count, setCount] = useState(1);
  const [totalPrice, setTotalPrice] = useState(PRICE);
  const { redirect } = useRouteMemory();

  const priceRender = totalPrice.toLocaleString();

  const updateCount = (count: number) => {
    setCount(count);
    setTotalPrice(count * PRICE);
  }

  return (
    <Card className="overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-2">
        <div>
          <div className="flex items-center gap-x-2">
            <SparklingHeart />
            <span className="text-2xl font-bold text-primary">재매칭 티켓</span>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            새로운 인연을 만나보세요
          </p>
        </div>
      </div>
    </CardHeader>

    <CardContent className="pt-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              티켓 가격
            </p>
            <p className="text-2xl font-bold">
              ₩{priceRender}
            </p>
          </div>
          <Counter
            value={count}
            onChange={updateCount}
            min={1}
            max={30}
            size="lg"
            className="opacity-50"
            disabled
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckIcon className="h-4 w-4" />
            <span>즉시 매칭 가능</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckIcon className="h-4 w-4" />
            <span>매칭 실패시 100% 환불</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckIcon className="h-4 w-4" />
            <span>안전한 결제</span>
          </div>
        </div>
        <Button 
          onClick={() => {
            redirect('payment/purchase', {
              identifier: 'rematching',
            });
          }}
          size="lg"
          className="w-full"
        >
          결제하기
        </Button>
      </div>
    </CardContent>
  </Card>

  )
}