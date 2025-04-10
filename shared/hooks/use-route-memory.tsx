import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useLocalStorage } from ".";

type Route = 'payment/purchase';
type Payload<T> = T;

export default function useRouteMemory() {
  const router = useRouter();
  const pathname = usePathname();
  const [beforeUrl, setBeforeUrl] = useLocalStorage<'before-url', string>('before-url', pathname);
  const [redirectPayload, setRedirectPayload] = useLocalStorage<'redirect-payload', Record<string, unknown> | null>('redirect-payload', null);

  const redirect = <T extends Record<string, unknown>>(route: Route, payload?: Payload<T>) => {
    if (payload) {
      setRedirectPayload(payload);
    }

    setBeforeUrl(pathname);
    router.push(route);
  };

  const back = () => {
    beforeUrl ? router.push(beforeUrl) : router.back();
    setBeforeUrl(null);
  };

  return { redirect, back, redirectPayload };
}
