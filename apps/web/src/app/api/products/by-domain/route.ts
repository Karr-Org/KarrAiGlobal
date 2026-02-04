import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const domain = request.nextUrl.searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain required' }, { status: 400 });
    }

    // Look up product by domain (supports with/without www)
    const cleanDomain = domain.replace(/^www\./, '');

    const { data: product, error } = await supabase
        .from('products')
        .select('id, slug, name')
        .or(`domain.eq.${cleanDomain},domain.eq.www.${cleanDomain}`)
        .single();

    if (error || !product) {
        return NextResponse.json({ error: 'Product not found for this domain' }, { status: 404 });
    }

    return NextResponse.json(product);
}
