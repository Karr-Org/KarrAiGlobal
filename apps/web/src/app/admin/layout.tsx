import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // In production, check if user is admin
    // For now, allow access for development
    // if (!user) {
    //   redirect('/auth/login?next=/admin');
    // }

    return (
        <div className="flex h-screen bg-cream-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto lg:pl-[260px]">
                <div className="min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
