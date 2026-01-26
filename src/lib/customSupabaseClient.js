import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vavkmgwwhhykktqrmwdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdmttZ3d3aGh5a2t0cXJtd2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjMwNDYsImV4cCI6MjA3OTIzOTA0Nn0.jG4lw0NDWxpPzFqjwLGTxriBksd0HAc0hGtBLKx5K7E';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
