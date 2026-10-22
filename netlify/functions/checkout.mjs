import { paymentHandler } from './lib/payment-service.mjs';
export default (request) => paymentHandler('checkout', request);
