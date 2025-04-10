import * as PaymentUI from './ui';
import PortOne from './portone';
import paymentApis from './api';

export const Payment = {
  ...PaymentUI,
  PortOne,
  Apis: paymentApis,
};
