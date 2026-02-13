const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length) {
            let val = values.join('=').trim();
            // Remove comments #...
            val = val.split('#')[0].trim();
            // Remove quotes
            val = val.replace(/^['"]|['"]$/g, '');
            env[key.trim()] = val;
        }
    });
    return env;
}

// Assume running from apps/web
const rootEnv = parseEnv('../../.env');
const webEnv = parseEnv('.env.local');
const combinedEnv = { ...rootEnv, ...webEnv };

const url = combinedEnv.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = combinedEnv.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing credentials.');
    console.log('URL found:', !!url);
    console.log('Key found:', !!key);
    process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
    console.log('Checking last 5 documents...');
    const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching data:', error);
    } else {
        if (data.length === 0) {
            console.log('No documents found.');
        } else {
            data.forEach(d => {
                console.log(`\nDOC: ${d.id}`);
                console.log(`Title: ${d.title}`);
                console.log(`Status: ${d.status}`);
                console.log(`Error: ${d.error_message || 'None'}`);
                console.log(`Chunks: ${d.chunk_count}`);
                console.log(`Created: ${new Date(d.created_at).toLocaleString()}`);
            });
        }
    }
})();
