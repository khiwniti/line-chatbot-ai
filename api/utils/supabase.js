const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
let supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'example-key';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
