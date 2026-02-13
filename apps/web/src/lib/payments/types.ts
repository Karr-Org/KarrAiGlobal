// ─── Payment Provider Abstraction ────────────────────────────────
// Add a new provider? Just implement this interface.

export type PaymentProviderName = 'stripe' | 'razorpay';

export interface CheckoutRequest {
    /** 'platform' = Tier 1 (Creator → MakeMyAI), 'product' = Tier 2 (EndUser → Creator) */
    tier: 'platform' | 'product';
    amount: number;           // In smallest unit (paise for INR, cents for USD)
    currency: string;         // 'inr' or 'usd'
    productName: string;
    productDescription: string;
    metadata: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
}

export interface CheckoutResult {
    /** Payment gateway-specific session/order ID */
    id: string;
    /** For redirect-based flows (Stripe) */
    url?: string;
    /** For embedded flows (Razorpay) — pass these to the frontend SDK */
    orderId?: string;
    key?: string;
    provider: PaymentProviderName;
}

export interface WebhookResult {
    verified: boolean;
    event?: {
        type: string;           // e.g. 'checkout.completed', 'payment.captured'
        tier?: 'platform' | 'product';
        metadata: Record<string, string>;
        subscriptionId?: string;
        customerId?: string;
        paymentId?: string;
    };
}

export interface PaymentProvider {
    name: PaymentProviderName;

    /** Create a checkout/order for subscription */
    createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;

    /** Verify and parse a webhook event */
    verifyWebhook(body: string, signature: string): Promise<WebhookResult>;
}
