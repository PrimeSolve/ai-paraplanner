import axiosInstance from './axiosInstance';

/**
 * Fetch the current billing status for the authenticated user's tenant.
 * Returns: { licenceType, subscriptionActive, soaCredits }
 */
export async function getBillingStatus() {
  const response = await axiosInstance.get('/billing/status');
  return response.data;
}

/**
 * Deduct 1 SOA credit from the tenant's balance.
 * Returns: { soaCredits } (new balance after deduction)
 */
export async function useCredit() {
  const response = await axiosInstance.post('/billing/use-credit');
  return response.data;
}
