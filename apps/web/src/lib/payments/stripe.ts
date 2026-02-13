import type { PaymentProvider, CheckoutRequest, CheckoutResult, WebhookResult } from './types';

export class StripeProvider implements PaymentProvider {
    name = 'stripe' as const;
    private stripe: any;
    private webhookSecret: string;

    constructor() {
        const key = process.env.STRIPE_SECRET_KEY;
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

        if (!key) throw new Error('STRIPE_SECRET_KEY not configured');

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Stripe = require('stripe');
        this.stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
    }

    async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{
                price_data: {
                    currency: req.currency,
                    product_data: {
                        name: req.productName,
                        description: req.productDescription,
                    },
                    unit_amount: req.amount,
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            }],
            metadata: req.metadata,
            success_url: req.successUrl,
            cancel_url: req.cancelUrl,
        });

        return {
            id: session.id,
            url: session.url,           // Stripe uses redirect-based checkout
            provider: 'stripe',
        };
    }

    async verifyWebhook(body: string, signature: string): Promise<WebhookResult> {
        try {
            const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);

            // Normalize to our common event format
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                return {
                    verified: true,
                    event: {
                        type: 'checkout.completed',
                        tier: session.metadata?.tier as any,
                        metadata: session.metadata || {},
                        subscriptionId: session.subscription,
                        customerId: session.customer,
                    },
                };
            }

            if (event.type === 'customer.subscription.deleted') {
                return {
                    verified: true,
                    event: {
                        type: 'subscription.cancelled',
                        metadata: event.data.object.metadata || {},
                        subscriptionId: event.data.object.id,
                    },
                };
            }

            // Pass through other events
            return {
                verified: true,
                event: {
                    type: event.type,
                    metadata: event.data?.object?.metadata || {},
                },
            };
        } catch {
            return { verified: false };
        }
    }
}
