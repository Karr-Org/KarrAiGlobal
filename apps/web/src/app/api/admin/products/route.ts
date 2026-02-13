import { NextResponse } from 'next/server';
import { requireCreator, getAdmin } from '@/lib/auth';

export async function GET() {
    try {
        await requireCreator();
        const supabase = getAdmin();
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch products' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            products: products || [],
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
