import axiosInstance from './axiosInstance';

export const getBillingStatus = () =>
  axiosInstance.get('/billing/status').then((res) => res.data);

export const createCheckout = (priceType, successUrl, cancelUrl) =>
  axiosInstance
    .post('/billing/checkout', { price_type: priceType, success_url: successUrl, cancel_url: cancelUrl })
    .then((res) => res.data);
