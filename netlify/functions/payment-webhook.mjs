import { paymentHandler } from './lib/payment-service.mjs';
export default (request) => paymentHandler('payment-webhook', request);
