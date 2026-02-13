import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';

// Tier 2: End-user product subscription payments
// Works with Stripe OR Razorpay — determined by PAYMENT_PROVIDER env var
export async function POST(request: NextRequest) {
    try {
        const { productUserId, productId, tierId, userId } = await request.json();

        if (!productId || !tierId) {
            return NextResponse.json({ error: 'productId and tierId required' }, { status: 400 });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get product tier details
        const { data: tier } = await supabase
            .from('product_tiers')
            .select('*')
            .eq('id', tierId)
            .single();

        if (!tier) {
            return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
        }

        // Get product details for naming
        const { data: product } = await supabase
            .from('products')
            .select('name, slug')
            .eq('id', productId)
            .single();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const currency = process.env.PAYMENT_CURRENCY || 'inr';

        // ─── Provider-agnostic checkout ──────────────────────
        let provider;
        try {
            provider = getPaymentProvider();
        } catch (err: any) {
            return NextResponse.json({
                error: `Payment provider not configured: ${err.message}`,
                code: 'PAYMENT_NOT_CONFIGURED',
            }, { status: 503 });
        }

        const result = await provider.createCheckout({
            tier: 'product',
            amount: tier.price || 0,
            currency,
            productName: `${product?.name || 'AI Product'} — ${tier.name}`,
            productDescription: tier.description || `Subscription to ${product?.name}`,
            metadata: {
                tier: 'product',
                product_id: productId,
                tier_id: tierId,
                product_user_id: productUserId || '',
                user_id: userId || '',
            },
            successUrl: `${appUrl}/p/${product?.slug}/dashboard?payment=success`,
            cancelUrl: `${appUrl}/p/${product?.slug}/dashboard?payment=canceled`,
        });

        return NextResponse.json({
            provider: result.provider,
            url: result.url,
            orderId: result.orderId,
            key: result.key,
            sessionId: result.id,
        });

    } catch (error: any) {
        console.error('Product payment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
