import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE - Remove duplicate knowledge bases (keep oldest)
export async function DELETE(request: NextRequest) {
    try {
        // Get all KBs grouped by name
        const { data: allKbs, error } = await supabase
            .from('knowledge_bases')
            .select('id, name, created_at')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Find duplicates (group by lowercase name)
        const nameMap = new Map<string, any[]>();
        for (const kb of allKbs || []) {
            const key = kb.name.toLowerCase().trim();
            if (!nameMap.has(key)) {
                nameMap.set(key, []);
            }
            nameMap.get(key)!.push(kb);
        }

        // Delete duplicates (keep oldest)
        const toDelete: string[] = [];
        for (const [, kbs] of nameMap) {
            if (kbs.length > 1) {
                // Keep first (oldest), delete rest
                for (let i = 1; i < kbs.length; i++) {
                    toDelete.push(kbs[i].id);
                }
            }
        }

        if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('knowledge_bases')
                .delete()
                .in('id', toDelete);

            if (deleteError) throw deleteError;
        }

        return NextResponse.json({
            success: true,
            deleted: toDelete.length,
            message: `Removed ${toDelete.length} duplicate knowledge bases`
        });

    } catch (error: any) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
