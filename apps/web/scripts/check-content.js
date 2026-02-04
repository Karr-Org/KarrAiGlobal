
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lvhlowposwuycwftbfqj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocumentContent() {
    console.log('Inspecting user_knowledge_chunks table structure...');

    const { data: chunk, error } = await supabase
        .from('user_knowledge_chunks')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching random chunk:', error);
        return;
    }

    if (!chunk || chunk.length === 0) {
        console.log('Table is empty. Cannot determine columns via checking row.');
        return;
    }

    console.log('Chunk columns found:', Object.keys(chunk[0]));

    // Now try to verify the specific document
    console.log('\nChecking uploaded document...');
    const { data: docs } = await supabase
        .from('user_documents')
        .order('created_at', { ascending: false })
        .limit(1);

    if (docs && docs.length > 0) {
        const doc = docs[0];
        console.log(`Latest Doc: ${doc.title} (${doc.id})`);

        // Use the column name we just found!
        const keys = Object.keys(chunk[0]);
        const idCol = keys.includes('user_document_id') ? 'user_document_id' :
            keys.includes('document_id') ? 'document_id' : null;

        if (!idCol) {
            console.error('Could not find document ID column in:', keys);
            return;
        }

        console.log(`Using ID column: ${idCol}`);

        const { data: chunks } = await supabase
            .from('user_knowledge_chunks')
            .select('content')
            .eq(idCol, doc.id);

        console.log(`Found ${chunks ? chunks.length : 0} chunks for this doc.`);
        if (chunks && chunks.length > 0) {
            console.log(`Content Length of first chunk: ${chunks[0].content ? chunks[0].content.length : 0}`);
        }
    }
}

function analyzeChunks(chunks) {
    if (!chunks || chunks.length === 0) {
        console.log('No chunks found for this document.');
        return;
    }

    console.log(`Found ${chunks.length} chunks.`);

    let totalLength = 0;
    let emptyChunks = 0;

    chunks.forEach(c => {
        const len = c.content ? c.content.length : 0;
        totalLength += len;
        if (len === 0) emptyChunks++;
    });

    console.log(`\nTotal Content Length: ${totalLength} characters`);
    console.log(`Empty Chunks: ${emptyChunks}`);

    if (chunks.length > 0) {
        console.log('\n--- First Chunk Preview ---');
        console.log(chunks[0].content ? chunks[0].content.substring(0, 200) + '...' : 'NULL');

        console.log('\n--- Middle Chunk Preview ---');
        const mid = Math.floor(chunks.length / 2);
        console.log(chunks[mid].content ? chunks[mid].content.substring(0, 200) + '...' : 'NULL');
    }
}

checkDocumentContent();
