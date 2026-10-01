'use client';

import { Button } from '@heroui/react';
import { Globe } from 'lucide-react';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

export default function CountryFAB({ onClick }: { onClick: () => void }) {
  const { session } = useAdminSession();
  return <Button onPress={onClick} className="fixed right-4 top-4 z-50" aria-label="운영 국가 변경"><Globe size={18} />{session?.selectedCountry?.toUpperCase() ?? '국가 선택'}</Button>;
}
