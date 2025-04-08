import { useEffect, useState } from "react";
import { TOSS_PAYMENTS_CONFIG } from "../config/payments";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

interface PaymentWidgetState {
  widgets: any;
  ready: boolean;
}

export function useTossPayments(amount?: number) {
  const [state, setState] = useState<PaymentWidgetState>({
    widgets: null,
    ready: false,
  });
  const [payAmount, setPayAmount] = useState<number>(amount || 0);

  const updatePayAmount = (amount: number) => {
    setPayAmount(amount);
  };

  useEffect(() => {
    const initializePayments = async () => {
      try {
        const tossPayments = await loadTossPayments(TOSS_PAYMENTS_CONFIG.clientKey);
        const widgets = tossPayments.widgets({ customerKey: generateRandomKey() });
        widgets.setAmount({ value: payAmount, currency: "KRW" });

        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#payment-method" }),
          widgets.renderAgreement({ selector: "#agreement" }),
        ]);

        setState({ widgets, ready: true });
      } catch (error) {
        console.error("Failed to initialize TossPayments:", error);
      }
    };

    initializePayments();

  }, [payAmount]);

  const requestPayment = async () => {
    if (!state.widgets || !state.ready) return;

    try {
      return await state.widgets.requestPayment({
        orderId: generateRandomKey(),
        orderName: "재매칭 결제",
        successUrl: TOSS_PAYMENTS_CONFIG.successUrl,
        failUrl: TOSS_PAYMENTS_CONFIG.failUrl,
      });
    } catch (error) {
      console.error("Payment request failed:", error);
      throw error;
    }
  };

  return { ...state, requestPayment, updatePayAmount };
}

function generateRandomKey() {
  return window.btoa(Math.random().toString()).slice(0, 20);
} 