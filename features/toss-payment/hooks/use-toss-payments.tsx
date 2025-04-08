'use client';

import { useEffect, useState } from "react";
import { TOSS_PAYMENTS_CONFIG } from "../config/payments";
import { loadTossPayments, TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useRef } from "react";
import paymentApis, { PaymentBeforeHistory } from "@/features/payment/api";

type PurchaseType = '재매칭';

export function useTossPayments(amount?: number) {
  const paymentWidgetRef = useRef<TossPaymentsWidgets | null>(null);
  const mountRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(amount || 0);
  const [isAgreed, setIsAgreed] = useState(true);
  
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
      if (mountRef.current) return;
      mountRef.current = true;

      const paymentWidget = await loadTossPayments(TOSS_PAYMENTS_CONFIG.clientKey);
      const widget = paymentWidget.widgets({ customerKey: generateRandomKey() });
      widget.setAmount({ value: payAmount, currency: "KRW" });
      paymentWidgetRef.current = widget;

      const [paymentMethods, agreement] = await Promise.all([
        widget.renderPaymentMethods({ selector: "#payment-method" }),
        widget.renderAgreement({ selector: "#agreement" }),
      ]);
      
      agreement.on('agreementStatusChange', ({ agreedRequiredTerms }) => {
        if (agreedRequiredTerms) {
          setIsAgreed(true);
        } else {
          setIsAgreed(false);
        }
      });

      setReady(true);
    })();
  }, []);


  const requestPayment = async (type: PurchaseType) => {
    if (!paymentWidgetRef.current || !ready) return;

    const paymentHistory = {
      orderId: generateRandomKey(),
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

function generateRandomKey() {
  return window.btoa(Math.random().toString()).slice(0, 20);
} 