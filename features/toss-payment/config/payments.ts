export const TOSS_PAYMENTS_CONFIG = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm",
  successUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/payments/success`,
  failUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/payments/fail`,
}; 