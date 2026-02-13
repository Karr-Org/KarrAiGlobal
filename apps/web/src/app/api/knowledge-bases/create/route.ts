import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAdmin, withAuth } from '@/lib/auth';
import { validateCreateKnowledgeBase } from '@/lib/validations';

export async function POST(request: NextRequest) {
    return withAuth(async () => {
        const user = await requireAuth();
        const body = await request.json();

        // Validate input
        const validation = validateCreateKnowledgeBase(body);
        if (!validation.success) return validation.response;

        const { name, description, userId } = validation.data;

        // Ensure user is creating for themselves
        if (userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized: Cannot create KB for another user' }, { status: 403 });
        }

        const supabase = getAdmin();

        // Check for duplicate name under this user
        const { data: existing } = await supabase
            .from('knowledge_bases')
            .select('id')
            .ilike('name', name)
            .eq('created_by', user.id)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: `You already have a Knowledge Base named "${name}"` },
                { status: 409 }
            );
        }

        const { data: kb, error } = await supabase
            .from('knowledge_bases')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('[KB Create] Insert error:', error);
            return NextResponse.json(
                { error: 'Failed to create Knowledge Base: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, knowledgeBase: kb });
    });
}
