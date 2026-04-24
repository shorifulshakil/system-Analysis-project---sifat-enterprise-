// Seeds a demo admin user (idempotent). Public endpoint, safe because credentials are fixed demo values.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "admin@gmail.com";
const DEMO_PASSWORD = "admin123";
const DEMO_USERNAME = "admin";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check if user exists
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw listErr;
    const exists = list.users.some((u) => u.email === DEMO_EMAIL);

    if (!exists) {
      const { error: createErr } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { username: DEMO_USERNAME, role: "admin" },
      });
      if (createErr) throw createErr;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        created: !exists,
        credentials: { username: DEMO_USERNAME, email: DEMO_EMAIL, password: DEMO_PASSWORD },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
