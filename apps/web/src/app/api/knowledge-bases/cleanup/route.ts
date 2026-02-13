import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAdmin, withAuth } from '@/lib/auth';

// DELETE - Remove duplicate knowledge bases (keep oldest) — scoped to authenticated user
export async function DELETE(request: NextRequest) {
    return withAuth(async () => {
        const user = await requireAuth();
        const supabase = getAdmin();

        // Get only this user's KBs
        const { data: allKbs, error } = await supabase
            .from('knowledge_bases')
            .select('id, name, created_at')
            .eq('created_by', user.id)
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
    });
}
