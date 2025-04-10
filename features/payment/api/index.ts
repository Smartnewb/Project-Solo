import axiosServer from "@/utils/axios";

export type PaymentBeforeHistory = {
  orderId: string;
  amount: number;
  orderName: string;
}

export type PaymentDetails = {
  orderId: string;
  txId: string;
};

const savePaymentHistory = async (paymentHistory: PaymentBeforeHistory) =>
  axiosServer.post('/payments/history', paymentHistory);

const pay = (paymentDetails: PaymentDetails) =>
  axiosServer.post('/payments/confirm', paymentDetails);

const paymentApis = {
  saveHistory: savePaymentHistory,
  pay,
};

export default paymentApis;
