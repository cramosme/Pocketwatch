import { createClient } from "@supabase/supabase-js";

// Load the required env variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase url environment variable missing");
}
if (!supabaseKey) {
  throw new Error("Supabase secret key environtment variable missing");
}

// Backend uses the secret key, which is permanent and has no
// user session. autoRefreshToken/persistSession only make sense for
// per-user clients (like the mobile app). Disable both here.
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});