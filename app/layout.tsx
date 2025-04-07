'use client';

import './globals.css'
import type { Metadata } from 'next'
// next/font 제거 - Babel 설정과 충돌 방지
import { AuthProvider } from '../contexts/AuthContext'
// import Navbar from '@/components/Navbar'
import { ModalProvider } from '@/shared/ui/modal/context'
// export const metadata: Metadata = {
//   title: 'Sometime',
//   description: '나의 이상형을 찾아서',
// }


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <ModalProvider>
            {/* <Navbar /> */}
            <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
              {children}
            </main>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
