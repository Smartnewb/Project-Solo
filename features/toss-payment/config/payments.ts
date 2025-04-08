export const TOSS_PAYMENTS_CONFIG = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm",
  successUrl: `${window.location.origin}/payment/purchase/success`,
  failUrl: `${window.location.origin}/payment/purchase/fail`,
}; 
