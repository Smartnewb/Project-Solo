'use client';

import './globals.css'
import type { Metadata } from 'next'
// next/font 제거 - Babel 설정과 충돌 방지
import { AuthProvider } from '../contexts/AuthContext'
// import Navbar from '@/components/Navbar'
// export const metadata: Metadata = {
//   title: 'Project-Solo',
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
          {/* <Navbar /> */}
          <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
