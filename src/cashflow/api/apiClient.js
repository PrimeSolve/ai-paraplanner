/**
 * Re-export the parent ai-paraplanner axios instance.
 * The parent app handles MSAL authentication and token injection,
 * so the cashflow module no longer needs its own auth layer.
 */
export { default } from "@/api/axiosInstance";
