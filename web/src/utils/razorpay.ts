import { verifyPayment } from '../services/api';

export interface RazorpayInitResponse {
  transaction_id: string;
  key_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  mock?: boolean;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

interface RazorpayConstructorOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayConstructorOptions) => RazorpayInstance;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function openRazorpayCheckout(
  init: RazorpayInitResponse,
  onSuccess: (payload: RazorpaySuccessPayload) => void,
  onDismiss?: () => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      reject(new Error('Could not load Razorpay checkout.'));
      return;
    }

    const rzp = new window.Razorpay({
      key: init.key_id,
      amount: init.amount,
      currency: init.currency,
      name: "Rudra's Farm Fresh",
      description: 'Order payment',
      order_id: init.razorpay_order_id,
      prefill: init.prefill,
      theme: { color: '#2d6a4f' },
      handler: (response) => {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
        resolve();
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
          reject(new Error('Payment cancelled'));
        },
      },
    });

    rzp.open();
  });
}

export async function runRazorpayCheckout(init: RazorpayInitResponse): Promise<{ paid: boolean }> {
  if (init.mock) {
    const result = await verifyPayment({ transaction_id: init.transaction_id });
    return { paid: result.paid };
  }

  const payload = await new Promise<RazorpaySuccessPayload>((resolve, reject) => {
    void openRazorpayCheckout(
      init,
      (response) => resolve(response),
      () => reject(new Error('Payment cancelled'))
    ).catch(reject);
  });

  const result = await verifyPayment({
    transaction_id: init.transaction_id,
    razorpay_order_id: payload.razorpay_order_id,
    razorpay_payment_id: payload.razorpay_payment_id,
    razorpay_signature: payload.razorpay_signature,
  });

  return { paid: result.paid };
}
