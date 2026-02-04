import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const domain = request.nextUrl.searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain required' }, { status: 400 });
    }

    try {
        // Try to resolve the domain by making a request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: controller.signal,
        }).catch(() => null);

        clearTimeout(timeoutId);

        if (response && response.ok) {
            return NextResponse.json({
                active: true,
                message: 'Domain is active and responding!'
            });
        }

        // Check if domain resolves at all using DNS lookup simulation
        // In production, you'd use a proper DNS check service
        return NextResponse.json({
            active: false,
            message: 'Domain not responding yet. DNS may still be propagating.'
        });

    } catch (error) {
        return NextResponse.json({
            active: false,
            message: 'Could not verify domain. Please check DNS settings.'
        });
    }
}
