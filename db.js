const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: SUPABASE_URL or SUPABASEKey is not set in environment variables');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

// Optional connection test (only if variables are present)
if (supabaseUrl && supabaseKey) {
  supabase
    .from('posts') // test querying posts table
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        // Table might not exist or be empty, which is normal for a new setup
        console.log('Supabase initialized (connection test returned):', error.message);
      } else {
        console.log('Supabase connection test success. Rows found:', data.length);
      }
    })
    .catch(err => {
      console.error('Supabase test catch error:', err.message);
    });
}

module.exports = supabase;