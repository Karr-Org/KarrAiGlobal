import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getPaymentProvider, detectWebhookProvider } from '@/lib/payments';

// ─── Unified Webhook Handler ─────────────────────────────────
// Auto-detects whether the webhook came from Stripe or Razorpay
// Then routes by metadata.tier ('platform' vs 'product')
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const headersList = await headers();

        // Auto-detect which provider sent this webhook
        const detected = detectWebhookProvider(headersList);
        if (!detected) {
            return NextResponse.json({
                error: 'Could not detect payment provider. Missing stripe-signature or x-razorpay-signature header.',
            }, { status: 400 });
        }

        console.log(`[webhook] Received from ${detected.provider}`);

        // Get the correct provider and verify
        let provider;
        try {
            provider = getPaymentProvider(detected.provider);
        } catch (err: any) {
            return NextResponse.json({
                error: `${detected.provider} not configured: ${err.message}`,
            }, { status: 503 });
        }

        const result = await provider.verifyWebhook(body, detected.signature);

        if (!result.verified) {
            console.error(`[webhook] ${detected.provider} signature verification FAILED`);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        if (!result.event) {
            return NextResponse.json({ received: true });
        }

        console.log(`[webhook] ${detected.provider} event: ${result.event.type}, tier: ${result.event.tier || 'n/a'}`);

        // ─── Route to tier handlers ──────────────────────────
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (result.event.type === 'checkout.completed') {
            if (result.event.tier === 'platform') {
                await handlePlatformCheckout(supabase, result.event, detected.provider);
            } else if (result.event.tier === 'product') {
                await handleProductCheckout(supabase, result.event, detected.provider);
            }
        } else if (result.event.type === 'subscription.cancelled') {
            await handleSubscriptionCancelled(supabase, result.event);
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─── TIER 1 HANDLER ──────────────────────────────────────────
async function handlePlatformCheckout(supabase: any, event: any, provider: string) {
    const { creator_id, plan_name } = event.metadata;

    console.log(`[webhook] Platform checkout via ${provider}: creator=${creator_id}, plan=${plan_name}`);

    const { data: plan } = await supabase
        .from('platform_plans')
        .select('id')
        .eq('name', plan_name)
        .single();

    if (plan) {
        await supabase
            .from('creator_profiles')
            .update({
                plan_id: plan.id,
                plan_status: 'active',
                // Store the provider-specific IDs
                [`${provider}_customer_id`]: event.customerId,
                payment_provider: provider,
                updated_at: new Date().toISOString(),
            })
            .eq('id', creator_id);
    }
}

// ─── TIER 2 HANDLER ──────────────────────────────────────────
async function handleProductCheckout(supabase: any, event: any, provider: string) {
    const { product_id, tier_id, product_user_id } = event.metadata;

    console.log(`[webhook] Product checkout via ${provider}: product=${product_id}, tier=${tier_id}`);

    if (product_user_id) {
        const { data: existing } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('product_user_id', product_user_id)
            .single();

        const subscriptionData = {
            product_user_id: product_user_id,
            tier_id: tier_id,
            status: 'active',
            payment_provider: provider,
            [`${provider}_subscription_id`]: event.subscriptionId,
            [`${provider}_customer_id`]: event.customerId,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        if (existing) {
            await supabase.from('subscriptions').update(subscriptionData).eq('id', existing.id);
        } else {
            await supabase.from('subscriptions').insert(subscriptionData);
        }
    }
}

// ─── CANCELLATION HANDLER ────────────────────────────────────
async function handleSubscriptionCancelled(supabase: any, event: any) {
    const subscriptionId = event.subscriptionId;
    if (!subscriptionId) return;

    console.log(`[webhook] Subscription cancelled: ${subscriptionId}`);

    // Try updating in subscriptions table
    await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .or(`stripe_subscription_id.eq.${subscriptionId},razorpay_subscription_id.eq.${subscriptionId}`);

    // Also check if it's a platform subscription (creator profile)
    const tier = event.metadata?.tier;
    if (tier === 'platform') {
        const creatorId = event.metadata?.creator_id;
        if (creatorId) {
            await supabase
                .from('creator_profiles')
                .update({ plan_status: 'cancelled' })
                .eq('id', creatorId);
        }
    }
}
