// ==============================================================================
// SUPABASE CLIENT INITIALIZATION
// ==============================================================================
// WARNING: Replace these placeholders with your actual Supabase URL and Anon Key
// from your Supabase Dashboard -> Settings -> API.
const SUPABASE_URL = 'https://ghfnukejqcioulphszil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZm51a2VqcWNpb3VscGhzemlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTc1NDMsImV4cCI6MjA5OTg5MzU0M30.l7syGaYq2QPHNyJ8FIiGY7_WVVfYtKxjSXj1gIxoc4Y';

// Initialize the Supabase client
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for other scripts if using modules, but since we are using plain scripts,
// it will be available in the global window object.
window.supabaseClient = client;
