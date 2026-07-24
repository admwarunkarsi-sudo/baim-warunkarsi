require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ghfnukejqcioulphszil.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZm51a2VqcWNpb3VscGhzemlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTc1NDMsImV4cCI6MjA5OTg5MzU0M30.l7syGaYq2QPHNyJ8FIiGY7_WVVfYtKxjSXj1gIxoc4Y'
);

async function addDummyMember() {
    const { data, error } = await supabase.from('kelas_members').insert([
        {
            full_name: 'Baim (Admin Test)',
            email: 'baimwarunkarsi@gmail.com',
            whatsapp: '085179660408',
            status: 'active'
        }
    ]);

    if (error) {
        console.error('Error inserting member:', error);
    } else {
        console.log('Successfully inserted Baim into kelas_members!', data);
    }
}

addDummyMember();
