'use client';

export const TOSS_PAYMENTS_CONFIG = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_GjLJoQ1aVZKqeyx1ndDArw6KYe2R",
  customerKey: "ANONYMOUS", // 비회원 결제
  successUrl: `${process.env.NEXT_PUBLIC_HOST}/payments/success`,
  failUrl: `${process.env.NEXT_PUBLIC_HOST}/payments/fail`,
}; 
