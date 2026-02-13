import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { CreatorSidebar } from '@/components/creator/CreatorSidebar';

export default async function CreatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/creator/login');
    }

    // Use service role to bypass RLS for profile lookup
    const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if they have a creator profile (using service role to bypass RLS)
    let { data: creator } = await admin
        .from('creator_profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

    // Auto-create profile if missing
    if (!creator) {
        try {
            // Get free plan
            const { data: freePlan } = await admin
                .from('platform_plans')
                .select('id')
                .eq('name', 'free')
                .single();

            const { error: insertError } = await admin
                .from('creator_profiles')
                .insert({
                    user_id: user.id,
                    display_name: user.user_metadata?.full_name
                        || user.user_metadata?.display_name
                        || user.email?.split('@')[0]
                        || 'Creator',
                    role: 'creator',
                    plan_id: freePlan?.id || null,
                    plan_status: 'active',
                    avatar_url: user.user_metadata?.avatar_url || null,
                });

            if (insertError) {
                console.error('[Creator Layout] Insert error:', insertError.message);
                // If duplicate key, the profile exists — re-query it
                if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
                    const { data: existingCreator } = await admin
                        .from('creator_profiles')
                        .select('id, role')
                        .eq('user_id', user.id)
                        .single();
                    creator = existingCreator;
                }
            } else {
                // Re-query to get the created profile
                const { data: newCreator } = await admin
                    .from('creator_profiles')
                    .select('id, role')
                    .eq('user_id', user.id)
                    .single();
                creator = newCreator;
            }
        } catch (e) {
            console.error('[Creator Layout] Error:', e);
        }
    }

    // If still no profile after all attempts, redirect to signup
    if (!creator) {
        redirect('/creator/signup');
    }

    return (
        <div className="flex h-screen bg-[#faf9f7]">
            <CreatorSidebar />
            <main className="flex-1 overflow-y-auto lg:pl-[240px]">
                <div className="min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
