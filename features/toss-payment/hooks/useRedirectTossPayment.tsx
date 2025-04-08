import { useLocalStorage } from "@/shared/hooks";
import { usePathname, useRouter } from "next/navigation";

export default function useRedirectTossPayment() {
  const router = useRouter();
  const location = usePathname();
  const [_, setBeforeTossPaymentUrl] = useLocalStorage('before-toss-payment-url', location);

  return () => {
    setBeforeTossPaymentUrl(location);
    router.push("/payment/purchase");
  };
}
