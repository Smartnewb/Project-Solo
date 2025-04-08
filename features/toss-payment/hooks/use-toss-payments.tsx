'use client';

import { useEffect, useState } from "react";
import { TOSS_PAYMENTS_CONFIG } from "../config/payments";
import { loadTossPayments, TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useRef } from "react";
import paymentApis, { PaymentBeforeHistory } from "@/features/payment/api";

type PurchaseType = '재매칭';

// 난수 생성 함수를 클라이언트 사이드에서만 실행되도록 수정
const generateRandomKey = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export function useTossPayments(amount?: number) {
  const paymentWidgetRef = useRef<TossPaymentsWidgets | null>(null);
  const mountRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(amount || 0);
  const [isAgreed, setIsAgreed] = useState(true);
  const [customerKey, setCustomerKey] = useState<string>('');

  // customerKey 생성을 useEffect 내부로 이동
  useEffect(() => {
    if (!customerKey) {
      setCustomerKey(generateRandomKey());
    }
  }, []);

  const updatePayAmount = (amount: number) => {
    const widget = paymentWidgetRef.current;
    if (!widget) {
      throw new Error('결제 위젯이 연동되지않았습니다.');
    }
    setPayAmount(amount);
    widget.setAmount({ value: payAmount, currency: "KRW" });
  };

  useEffect(() => {
    (async () => {
      if (mountRef.current || !customerKey) return;
      mountRef.current = true;

      try {
        const paymentWidget = await loadTossPayments(TOSS_PAYMENTS_CONFIG.clientKey);
        const widget = paymentWidget.widgets({ customerKey });
        widget.setAmount({ value: payAmount, currency: "KRW" });
        paymentWidgetRef.current = widget;

        const [paymentMethods, agreement] = await Promise.all([
          widget.renderPaymentMethods({ selector: "#payment-method" }),
          widget.renderAgreement({ selector: "#agreement" }),
        ]);
        
        agreement.on('agreementStatusChange', ({ agreedRequiredTerms }) => {
          setIsAgreed(agreedRequiredTerms);
        });

        setReady(true);
      } catch (error) {
        console.error('Payment widget initialization failed:', error);
      }
    })();
  }, [customerKey, payAmount]);

  const requestPayment = async (type: PurchaseType) => {
    if (!paymentWidgetRef.current || !ready) return;

    const orderId = generateRandomKey();
    const paymentHistory = {
      orderId,
      orderName: `${type}`,
      amount: payAmount,
    } as PaymentBeforeHistory;

    try {
      await paymentApis.saveHistory(paymentHistory);
      return await paymentWidgetRef.current.requestPayment({
        orderId: paymentHistory.orderId,
        orderName: paymentHistory.orderName,
        successUrl: TOSS_PAYMENTS_CONFIG.successUrl,
        failUrl: TOSS_PAYMENTS_CONFIG.failUrl,
      });
    } catch (error) {
      console.error("Payment request failed:", error);
      throw error;
    }
  };

  return { ready, requestPayment, updatePayAmount, isAgreed };
} 