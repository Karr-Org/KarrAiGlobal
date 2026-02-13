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
                suggestedQueries={[
                    "What is the GST rate on mobile phones?",
                    "How to file GSTR-3B?",
                    "What is Input Tax Credit (ITC)?",
                    "Due date for GSTR-1 filing",
                    "GST registration process",
                ]}
                placeholder="Ask anything about GST..."
                welcomeMessage="Welcome! 👋\n\nI'm your AI assistant for **GST (Goods & Services Tax)**. I can help with GST rates, filing procedures, ITC claims, compliance, and more. How can I assist you today?"
            />
        </div>
    );
}
