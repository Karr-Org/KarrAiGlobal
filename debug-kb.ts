
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from apps/web/.env.local (where I put the key)
dotenv.config({ path: path.join(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentDocs() {
    console.log('Checking recent documents...');
    const { data: docs, error } = await supabase
        .from('knowledge_documents')
        .select('id, title, status, error_message, created_at, chunk_count')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching docs:', error);
        return;
    }

    console.table(docs);
}

checkRecentDocs();
