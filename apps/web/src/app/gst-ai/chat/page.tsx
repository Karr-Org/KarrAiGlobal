import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default async function GstAiChatPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // For now, allow unauthenticated access for demo
    // In production, redirect to login
    // if (!user) {
    //   redirect('/auth/login?next=/gst-ai/chat');
    // }

    return (
        <div className="h-screen flex flex-col">
            <ChatInterface
                productId="gst-ai"
                productName="GST AI"
                userId={user?.id}
            />
        </div>
    );
}
