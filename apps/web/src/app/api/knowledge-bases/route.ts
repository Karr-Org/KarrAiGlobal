import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAdmin, withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    return withAuth(async () => {
        const user = await requireAuth();
        const supabase = getAdmin();

        const query = supabase
            .from('knowledge_bases')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        const { data: kbs, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Add document counts server-side (service role — no RLS issues)
        const kbsWithCounts = await Promise.all(
            (kbs || []).map(async (kb: any) => {
                const { count } = await supabase
                    .from('knowledge_documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('knowledge_base_id', kb.id);
                return { ...kb, document_count: count || 0 };
            })
        );

        return NextResponse.json(kbsWithCounts);
    });
}

// DELETE all knowledge bases — scoped to authenticated user only
export async function DELETE(request: NextRequest) {
    return withAuth(async () => {
        const user = await requireAuth();
        const supabase = getAdmin();

        // Only delete KBs owned by this user — never allow wiping all KBs
        // Step 1: Get this user's KBs
        const { data: userKbs } = await supabase
            .from('knowledge_bases')
            .select('id')
            .eq('created_by', user.id);

        if (!userKbs || userKbs.length === 0) {
            return NextResponse.json({ success: true, message: 'No knowledge bases to delete' });
        }

        const kbIds = userKbs.map((kb: any) => kb.id);

        // Step 2: Get documents in those KBs
        const { data: docs } = await supabase
            .from('knowledge_documents')
            .select('id')
            .in('knowledge_base_id', kbIds);

        // Step 3: Delete chunks -> documents -> KBs
        if (docs && docs.length > 0) {
            const docIds = docs.map((d: any) => d.id);
            await supabase.from('knowledge_chunks').delete().in('document_id', docIds);
        }

        await supabase.from('knowledge_documents').delete().in('knowledge_base_id', kbIds);
        const { error } = await supabase.from('knowledge_bases').delete().in('id', kbIds);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'All your knowledge bases deleted' });
    });
}
