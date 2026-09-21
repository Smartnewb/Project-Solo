import './globals.css';
import type { Metadata } from 'next';
import { ClientProviders } from './client-providers';

export const metadata: Metadata = {
  title: 'Sometime',
  description: '관리자 대시보드',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ClientProviders>
          <main className="min-h-screen bg-white text-[#222222]">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
