import { cn } from "@/shared/utils";

type ProductProps = {
  name: string;
  price: number;
  count: number;
  description: string;
  className?: string;
}

export default function Product({ name, price, description, count, className }: ProductProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <h1 className="text-primary text-2xl font-bold mb-1">{name}</h1>
      <p className="text-gray-500 text-sm pb-2">{description}</p>

      <div className="flex gap-x-1">
        <p className="text-gray-500 text-sm">수량:</p>
        <p className="text-gray-500 text-sm">{count}회</p>
      </div>

      <div className="flex gap-x-1.5 items-center">
        <p className="text-gray-800 text-lg font-bold">가격</p>
        <p className="text-primary font-bold text-lg">총 {price * count}원</p>
      </div>
    </div>
  );
}
