require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ghfnukejqcioulphszil.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZm51a2VqcWNpb3VscGhzemlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTc1NDMsImV4cCI6MjA5OTg5MzU0M30.l7syGaYq2QPHNyJ8FIiGY7_WVVfYtKxjSXj1gIxoc4Y'
);

async function checkColumns() {
    // Try to select affiliate_code
    const { data, error } = await supabase.from('kelas_members').select('id, email, status, affiliate_code').limit(1);
    if (error) {
        console.error("Column might not exist:", error);
    } else {
        console.log("Success! Columns:", Object.keys(data[0] || {}));
    }
}

checkColumns();
