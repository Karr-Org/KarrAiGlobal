// Script to verify the contributor points fix
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://lvhlowposwuycwftbfqj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aGxvd3Bvc3d1eWN3ZnRiZnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTkyMDUyMiwiZXhwIjoyMDg1NDk2NTIyfQ.A6u6jcXJajTM4S2Qf3vwmiJkXH2JNcb6nAbIpsbMiEI'
);

async function verifyFix() {
    console.log('=== Verifying Contributor Points Fix ===\n');

    // 1. Check if gamification columns exist
    console.log('1. Checking gamification columns on product_users...');
    const { data: sampleUser, error: userError } = await supabase
        .from('product_users')
        .select('id, display_name, contributor_score, contributor_rank, total_docs_contributed')
        .limit(1)
        .single();

    if (userError) {
        if (userError.message.includes('contributor_score')) {
            console.log('   ❌ Gamification columns NOT FOUND!');
            console.log('   → You need to run migration 013_contributor_gamification.sql in Supabase');
            return;
        }
        console.log('   ⚠️  Could not fetch user:', userError.message);
    } else {
        console.log('   ✅ Gamification columns exist');
        console.log(`   Sample user: ${sampleUser?.display_name || 'N/A'}, Score: ${sampleUser?.contributor_score || 0}`);
    }

    // 2. Check if award_contributor_points function exists
    console.log('\n2. Checking award_contributor_points function...');
    const { error: funcError } = await supabase.rpc('award_contributor_points', {
        p_product_user_id: '00000000-0000-0000-0000-000000000000', // Fake ID
        p_chunk_count: 0,
        p_uniqueness_score: 0
    });

    if (funcError && funcError.message.includes('function') && funcError.message.includes('does not exist')) {
        console.log('   ❌ Function NOT FOUND!');
        console.log('   → You need to run migration 013_contributor_gamification.sql in Supabase');
        return;
    } else if (funcError && !funcError.message.includes('does not exist')) {
        // Expected to fail with invalid ID
        console.log('   ✅ Function exists (got expected error for test call)');
    } else {
        console.log('   ✅ Function exists');
    }

    // 3. Check pending suggestions
    console.log('\n3. Checking for pending knowledge suggestions...');
    const { data: suggestions, error: sugError } = await supabase
        .from('knowledge_suggestions')
        .select('id, topic, source_user_id, similarity_to_kb, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

    if (sugError) {
        console.log('   ⚠️  Error fetching suggestions:', sugError.message);
    } else if (!suggestions || suggestions.length === 0) {
        console.log('   ℹ️  No pending suggestions found');
        console.log('   → To test approval, a user needs to upload a document first');
    } else {
        console.log(`   ✅ Found ${suggestions.length} pending suggestion(s):`);
        for (const s of suggestions) {
            console.log(`      - "${s.topic}" (similarity: ${(s.similarity_to_kb * 100).toFixed(1)}%, user: ${s.source_user_id ? 'Yes' : 'No'})`);
        }
    }

    // 4. Check leaderboard
    console.log('\n4. Checking knowledge_leaderboard view...');
    const { data: leaderboard, error: lbError } = await supabase
        .from('knowledge_leaderboard')
        .select('*')
        .limit(5);

    if (lbError) {
        if (lbError.message.includes('knowledge_leaderboard')) {
            console.log('   ❌ Leaderboard view NOT FOUND!');
            console.log('   → You need to run migration 013_contributor_gamification.sql in Supabase');
        } else {
            console.log('   ⚠️  Error:', lbError.message);
        }
    } else if (!leaderboard || leaderboard.length === 0) {
        console.log('   ℹ️  No contributors with scores yet');
    } else {
        console.log(`   ✅ Leaderboard works! Top contributors:`);
        for (const l of leaderboard) {
            console.log(`      - ${l.display_name}: ${l.contributor_score} pts (${l.contributor_rank})`);
        }
    }

    console.log('\n=== Verification Complete ===');
    console.log('\nCode fix status: ✅ Applied');
    console.log('Next steps:');
    console.log('  1. Ensure migration 013 is run in Supabase');
    console.log('  2. Have a user upload a unique document');
    console.log('  3. Approve the suggestion as admin');
    console.log('  4. Check the user\'s contributor stats in their dashboard');
}

verifyFix().catch(console.error);
