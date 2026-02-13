import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

// Service role client — bypasses RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DocumentRow {
    id: string;
}

// GET: Retrieve a single KB with its documents
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const kbId = params.id;

        // Auth check: verify the caller owns this KB (optional for public KBs but good for security)
        const supabaseAuth = await createServerSupabase();
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch KB details
        const { data: kb, error: kbError } = await supabaseAdmin
            .from('knowledge_bases')
            .select('*')
            .eq('id', kbId)
            .single();

        if (kbError || !kb) {
            return NextResponse.json({ error: 'Knowledge Base not found' }, { status: 404 });
        }

        // Verify ownership
        if (kb.created_by !== user.id) {
            return NextResponse.json({ error: 'Unauthorized access to Knowledge Base' }, { status: 403 });
        }

        // Fetch documents
        const { data: docs, error: docsError } = await supabaseAdmin
            .from('knowledge_documents')
            .select('*')
            .eq('knowledge_base_id', kbId)
            .order('created_at', { ascending: false });

        if (docsError) {
            console.error('[KB Details] Failed to fetch documents:', docsError);
            return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
        }

        return NextResponse.json({ ...kb, documents: docs || [] });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[KB Details] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const kbId = params.id;

        // Auth check: verify the caller owns this KB
        const supabaseAuth = await createServerSupabase();
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const { data: kb } = await supabaseAdmin
            .from('knowledge_bases')
            .select('created_by')
            .eq('id', kbId)
            .single();

        if (!kb || kb.created_by !== user.id) {
            return NextResponse.json({ error: 'Knowledge Base not found or not owned by you' }, { status: 404 });
        }

        // Delete chunks first (FK constraint)
        const { data: docs } = await supabaseAdmin
            .from('knowledge_documents')
            .select('id')
            .eq('knowledge_base_id', kbId);

        if (docs && docs.length > 0) {
            await supabaseAdmin
                .from('knowledge_chunks')
                .delete()
                .in('document_id', (docs as DocumentRow[]).map(d => d.id));
        }

        // Delete documents
        await supabaseAdmin
            .from('knowledge_documents')
            .delete()
            .eq('knowledge_base_id', kbId);

        // Delete the KB
        const { error } = await supabaseAdmin
            .from('knowledge_bases')
            .delete()
            .eq('id', kbId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[KB Delete] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

