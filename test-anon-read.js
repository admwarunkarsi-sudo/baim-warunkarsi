require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testQuery() {
    const { data, error } = await supabase.from('kelas_members').select('*').eq('email', 'admin@baimwarunkarsi.com');
    console.log(data, error);
}
testQuery();
