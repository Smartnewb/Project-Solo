import { cn } from "@/shared/utils";

type ProductProps = {
  name: string;
  count: number;
  description: string;
  className?: string;
}

/**
 * @deprecated 토스페이먼츠 연동 UI 이며 현재 사용하지 않음
 */
export default function Product({ name, description, count, className }: ProductProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <h1 className="text-primary text-2xl font-bold mb-1">{name}</h1>
      <p className="text-gray-500 text-sm pb-2">{description}</p>

      <div className="flex gap-x-1">
        <p className="text-gray-500 text-sm">수량:</p>
        <p className="text-gray-500 text-sm">{count}개</p>
      </div>

    </div>
  );
}
