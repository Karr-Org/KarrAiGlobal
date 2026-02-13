import type { PaymentProvider, PaymentProviderName } from './types';

export type { PaymentProvider, PaymentProviderName, CheckoutRequest, CheckoutResult, WebhookResult } from './types';

// ─── Provider Factory ─────────────────────────────────────────
// Reads PAYMENT_PROVIDER env var — defaults to 'razorpay'
// Set to 'stripe' if you want Stripe instead

let _cachedProvider: PaymentProvider | null = null;

export function getPaymentProvider(forceProvider?: PaymentProviderName): PaymentProvider {
    const providerName = forceProvider || (process.env.PAYMENT_PROVIDER as PaymentProviderName) || 'razorpay';

    // Return cached if same provider
    if (_cachedProvider && _cachedProvider.name === providerName) {
        return _cachedProvider;
    }

    switch (providerName) {
        case 'stripe': {
            const { StripeProvider } = require('./stripe');
            _cachedProvider = new StripeProvider();
            break;
        }
        case 'razorpay': {
            const { RazorpayProvider } = require('./razorpay');
            _cachedProvider = new RazorpayProvider();
            break;
        }
        default:
            throw new Error(`Unknown payment provider: ${providerName}. Supported: stripe, razorpay`);
    }

    return _cachedProvider!;
}

/**
 * Detect which provider sent a webhook based on the signature header
 * Stripe uses 'stripe-signature', Razorpay uses 'x-razorpay-signature'
 */
export function detectWebhookProvider(headers: Headers): { provider: PaymentProviderName; signature: string } | null {
    const stripeSig = headers.get('stripe-signature');
    if (stripeSig) {
        return { provider: 'stripe', signature: stripeSig };
    }

    const razorpaySig = headers.get('x-razorpay-signature');
    if (razorpaySig) {
        return { provider: 'razorpay', signature: razorpaySig };
    }

    return null;
}
