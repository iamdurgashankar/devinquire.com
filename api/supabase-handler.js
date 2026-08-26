const { withSupabase } = require('@supabase/server');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

/**
 * Supabase Request Handler using @supabase/server SDK.
 * 
 * It automatically parses credentials from environment variables:
 * - SUPABASE_URL
 * - SUPABASE_PUBLISHABLE_KEY
 * - SUPABASE_SECRET_KEY
 * - SUPABASE_JWKS_URL
 * 
 * Provides:
 * - ctx.supabase (RLS-scoped client matching user credentials)
 * - ctx.supabaseAdmin (bypasses RLS utilizing service_role key)
 */
const handler = {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      // Query using the RLS-scoped client (automatically authenticated with the user's JWT)
      const { data, error } = await ctx.supabase
        .from('todos')
        .select('*');

      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  })
};

module.exports = handler;
