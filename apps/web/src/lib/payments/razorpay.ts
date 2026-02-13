import crypto from 'crypto';
import type { PaymentProvider, CheckoutRequest, CheckoutResult, WebhookResult } from './types';

// ─── Razorpay Payment Provider ────────────────────────────────
// Docs: https://razorpay.com/docs/api/
// Subscriptions: https://razorpay.com/docs/api/payments/subscriptions/

export class RazorpayProvider implements PaymentProvider {
    name = 'razorpay' as const;
    private keyId: string;
    private keySecret: string;
    private webhookSecret: string;
    private baseUrl = 'https://api.razorpay.com/v1';

    constructor() {
        this.keyId = process.env.RAZORPAY_KEY_ID || '';
        this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

        if (!this.keyId || !this.keySecret) {
            throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET not configured');
        }
    }

    private get authHeader(): string {
        return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    }

    /**
     * Create a Razorpay subscription
     * 
     * Flow:
     * 1. Create/get a Razorpay Plan (maps to the pricing)
     * 2. Create a Subscription on that plan
     * 3. Return the subscription + short_url for hosted checkout
     *    OR return orderId + keyId for embedded checkout on frontend
     */
    async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
        // Step 1: Create a Plan (Razorpay requires plans for subscriptions)
        const plan = await this.createOrGetPlan(req);

        // Step 2: Create a Subscription on that plan
        const subscription = await this.apiCall('/subscriptions', {
            plan_id: plan.id,
            total_count: 120,                 // Max billing cycles (10 years of monthly)
            quantity: 1,
            notes: req.metadata,              // Razorpay "notes" = our metadata
            notify_customer: 0,               // We handle our own notifications
        });

        // Razorpay has two checkout modes:
        // 1. Hosted page (short_url) — like Stripe Checkout
        // 2. Embedded (Standard Checkout) — JS modal on your page
        // We return both so the frontend can choose

        return {
            id: subscription.id,
            url: subscription.short_url,       // Hosted checkout URL (like Stripe)
            orderId: subscription.id,          // For embedded checkout
            key: this.keyId,                   // Frontend needs this for embedded
            provider: 'razorpay',
        };
    }

    /**
     * Verify Razorpay webhook signature
     * Razorpay uses HMAC-SHA256 with the webhook secret
     */
    async verifyWebhook(body: string, signature: string): Promise<WebhookResult> {
        try {
            // Verify HMAC-SHA256 signature
            const expectedSig = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(body)
                .digest('hex');

            if (expectedSig !== signature) {
                console.error('[razorpay] Webhook signature mismatch');
                return { verified: false };
            }

            const payload = JSON.parse(body);
            const eventType = payload.event;

            // ─── Normalize Razorpay events to our common format ─────

            if (eventType === 'subscription.activated' || eventType === 'subscription.charged') {
                const subscription = payload.payload?.subscription?.entity;
                const payment = payload.payload?.payment?.entity;
                const notes = subscription?.notes || payment?.notes || {};

                return {
                    verified: true,
                    event: {
                        type: 'checkout.completed',
                        tier: notes.tier as any,
                        metadata: notes,
                        subscriptionId: subscription?.id,
                        customerId: subscription?.customer_id,
                        paymentId: payment?.id,
                    },
                };
            }

            if (eventType === 'subscription.cancelled' || eventType === 'subscription.halted') {
                const subscription = payload.payload?.subscription?.entity;
                return {
                    verified: true,
                    event: {
                        type: 'subscription.cancelled',
                        metadata: subscription?.notes || {},
                        subscriptionId: subscription?.id,
                    },
                };
            }

            if (eventType === 'payment.captured') {
                const payment = payload.payload?.payment?.entity;
                return {
                    verified: true,
                    event: {
                        type: 'payment.captured',
                        metadata: payment?.notes || {},
                        paymentId: payment?.id,
                    },
                };
            }

            // Pass through other events
            return {
                verified: true,
                event: {
                    type: eventType,
                    metadata: {},
                },
            };
        } catch (err) {
            console.error('[razorpay] Webhook verification error:', err);
            return { verified: false };
        }
    }

    // ─── Internal helpers ──────────────────────────────────────────

    private async createOrGetPlan(req: CheckoutRequest): Promise<any> {
        // Create a Razorpay plan for this subscription type
        // In production you'd cache/reuse plans, but this is fine for now
        const res = await this.apiCall('/plans', {
            period: 'monthly',
            interval: 1,
            item: {
                name: req.productName,
                description: req.productDescription,
                amount: req.amount,               // In paise (INR) or cents
                currency: req.currency.toUpperCase(),
            },
            notes: {
                tier: req.metadata.tier || '',
                source: 'makemyai',
            },
        });

        return res;
    }

    private async apiCall(endpoint: string, data: any): Promise<any> {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': this.authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: { description: res.statusText } }));
            throw new Error(`Razorpay API error: ${err?.error?.description || res.statusText}`);
        }

        return res.json();
    }
}
