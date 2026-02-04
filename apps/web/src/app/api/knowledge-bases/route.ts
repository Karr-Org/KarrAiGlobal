import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const { data: kbs, error } = await supabase
        .from('knowledge_bases')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(kbs);
}

// DELETE all knowledge bases
export async function DELETE(request: NextRequest) {
    try {
        // Delete all chunks first (due to FK)
        await supabase.from('knowledge_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete all documents
        await supabase.from('knowledge_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // Delete all KBs
        const { error } = await supabase.from('knowledge_bases').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'All knowledge bases deleted' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
