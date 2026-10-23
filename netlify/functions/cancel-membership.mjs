import { paymentHandler } from './lib/payment-service.mjs';
export default (request) => paymentHandler('cancel-membership', request);
