import { useLocalStorage } from "@/shared/hooks";
import { usePathname, useRouter } from "next/navigation";

export default function useRedirectTossPayment() {
  const router = useRouter();
  const location = usePathname();
  const [url, setBeforeTossPaymentUrl] = useLocalStorage('before-toss-payment-url', location);

  const redirect = () => {
    setBeforeTossPaymentUrl(location);
    router.push("/payment/purchase");
  };

  const back = () => {
    url ? router.push(url) : router.back();
    setBeforeTossPaymentUrl(null);
  };
  

  return { redirect, back };
}
