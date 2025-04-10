import { nanoid } from 'nanoid';
import PortOneModule from '@portone/browser-sdk/v2';

export type PaymentRequest = {
  paymentId: string;
  totalAmount: number;
  orderName: string;  
  payMethod: 'CARD';
}

const createUniqueId = () =>
  nanoid()
    .replaceAll(/-/g, '')
    .replaceAll(/_/g, '');

const pay = async ({ paymentId, totalAmount, orderName, payMethod }: PaymentRequest) => {
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_KPN_CHANNEL as string;
  const storeId = process.env.NEXT_PUBLIC_PORTONE_KPN_MID as string;

  return await PortOneModule.requestPayment({
    paymentId,
      totalAmount,
    storeId,
    orderName,
    currency: 'CURRENCY_KRW',
    payMethod,
    channelKey,
    customData: {
      orderId: paymentId,
      amount: totalAmount,
      orderName,
    },
  });
}

const PortOne = {
  pay,
  createUniqueId,
};

export default PortOne;
