import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';

// Tier 1: Creator platform subscription payments
// Works with Stripe OR Razorpay — determined by PAYMENT_PROVIDER env var
export async function POST(request: NextRequest) {
    try {
        const { creatorId, planName, userId } = await request.json();

        if (!creatorId || !planName) {
            return NextResponse.json({ error: 'creatorId and planName required' }, { status: 400 });
        }

        // Get plan details for pricing
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: plan } = await supabase
            .from('platform_plans')
            .select('*')
            .eq('name', planName)
            .single();

        if (!plan || plan.price_monthly === 0) {
            return NextResponse.json({
                error: planName === 'free' ? 'Free plan does not require payment' : 'Plan not found',
            }, { status: 400 });
        }

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
            tier: 'platform',
            amount: plan.price_monthly,
            currency,
            productName: `MakeMyAI ${plan.display_name} Plan`,
            productDescription: `Platform subscription — ${plan.display_name}`,
            metadata: {
                tier: 'platform',
                creator_id: creatorId,
                plan_name: planName,
                user_id: userId || '',
            },
            successUrl: `${appUrl}/creator/billing?success=true`,
            cancelUrl: `${appUrl}/creator/billing?canceled=true`,
        });

        return NextResponse.json({
            provider: result.provider,
            url: result.url,        // For redirect checkout (Stripe)
            orderId: result.orderId, // For embedded checkout (Razorpay)
            key: result.key,         // For embedded checkout (Razorpay)
            sessionId: result.id,
        });

    } catch (error: any) {
        console.error('Platform payment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
