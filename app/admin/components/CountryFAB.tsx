'use client';

import { useCountry } from '@/contexts/CountryContext';

interface CountryFABProps {
  onClick: () => void;
}

export default function CountryFAB({ onClick }: CountryFABProps) {
  const { country, countryFlag, countryLabel } = useCountry();

  const bgColor = country === 'kr' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600';

  return (
    <button
      onClick={onClick}
      className={`fixed top-4 right-4 z-50 w-12 h-12 rounded-full ${bgColor}
                  text-white text-xl shadow-lg hover:shadow-xl hover:scale-105
                  transition-all duration-200 flex items-center justify-center`}
      title={`현재: ${countryLabel} - 클릭하여 변경`}
    >
      {countryFlag}
    </button>
  );
}
