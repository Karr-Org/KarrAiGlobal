import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional

// Add domain to Vercel project
export async function POST(request: NextRequest) {
    try {
        const { domain, productId } = await request.json();

        if (!domain || !productId) {
            return NextResponse.json({ error: 'Domain and productId required' }, { status: 400 });
        }

        if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
            return NextResponse.json({
                error: 'Vercel API not configured. Please add VERCEL_TOKEN and VERCEL_PROJECT_ID to environment variables.',
                code: 'VERCEL_NOT_CONFIGURED'
            }, { status: 500 });
        }

        // Clean domain
        const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

        // Add domain to Vercel
        const vercelUrl = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;

        const vercelRes = await fetch(vercelUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: cleanDomain }),
        });

        const vercelData = await vercelRes.json();

        if (!vercelRes.ok) {
            // Check if domain already exists (not an error)
            if (vercelData.error?.code === 'domain_already_in_use') {
                // Domain exists, check if it's ours
                return NextResponse.json({
                    success: true,
                    message: 'Domain already configured',
                    domain: cleanDomain,
                    status: 'pending_verification'
                });
            }

            return NextResponse.json({
                error: vercelData.error?.message || 'Failed to add domain to Vercel',
                code: vercelData.error?.code
            }, { status: 400 });
        }

        // Update product in database
        await supabase
            .from('products')
            .update({ domain: cleanDomain })
            .eq('id', productId);

        return NextResponse.json({
            success: true,
            message: 'Domain added successfully',
            domain: cleanDomain,
            verification: vercelData.verification,
            status: vercelData.verified ? 'active' : 'pending_verification'
        });

    } catch (error: any) {
        console.error('Add domain error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Check domain status on Vercel
export async function GET(request: NextRequest) {
    try {
        const domain = request.nextUrl.searchParams.get('domain');

        if (!domain) {
            return NextResponse.json({ error: 'Domain required' }, { status: 400 });
        }

        if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
            return NextResponse.json({
                error: 'Vercel API not configured',
                code: 'VERCEL_NOT_CONFIGURED'
            }, { status: 500 });
        }

        const cleanDomain = domain.trim().toLowerCase();

        // Get domain status from Vercel
        const vercelUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${cleanDomain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;

        const vercelRes = await fetch(vercelUrl, {
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
            },
        });

        if (!vercelRes.ok) {
            if (vercelRes.status === 404) {
                return NextResponse.json({
                    exists: false,
                    message: 'Domain not found on Vercel. Please add it first.'
                });
            }
            const error = await vercelRes.json();
            return NextResponse.json({ error: error.error?.message }, { status: 400 });
        }

        const data = await vercelRes.json();

        return NextResponse.json({
            exists: true,
            verified: data.verified,
            status: data.verified ? 'active' : 'pending_verification',
            verification: data.verification,
            message: data.verified
                ? '🎉 Domain is verified and active!'
                : 'Domain added but DNS verification pending'
        });

    } catch (error: any) {
        console.error('Check domain error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Remove domain from Vercel
export async function DELETE(request: NextRequest) {
    try {
        const domain = request.nextUrl.searchParams.get('domain');
        const productId = request.nextUrl.searchParams.get('productId');

        if (!domain) {
            return NextResponse.json({ error: 'Domain required' }, { status: 400 });
        }

        if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
            // If Vercel not configured, just remove from DB
            if (productId) {
                await supabase
                    .from('products')
                    .update({ domain: null })
                    .eq('id', productId);
            }
            return NextResponse.json({ success: true, message: 'Domain removed from database' });
        }

        const cleanDomain = domain.trim().toLowerCase();

        // Remove domain from Vercel
        const vercelUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${cleanDomain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;

        await fetch(vercelUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
            },
        });

        // Update product in database
        if (productId) {
            await supabase
                .from('products')
                .update({ domain: null })
                .eq('id', productId);
        }

        return NextResponse.json({
            success: true,
            message: 'Domain removed successfully'
        });

    } catch (error: any) {
        console.error('Remove domain error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
