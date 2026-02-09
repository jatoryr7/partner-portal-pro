import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitePartnerRequest {
  email: string;
  partnerId: string;
}

function randomPassword(): string {
  return crypto.randomUUID().replace(/-/g, "") + "A1a!";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: roles } = await supabaseAnon
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, partnerId }: InvitePartnerRequest = await req.json();
    if (!email || !partnerId) {
      return new Response(
        JSON.stringify({ error: "Missing email or partnerId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: partner, error: partnerErr } = await supabaseAdmin
      .from("partners")
      .select("id, company_name")
      .eq("id", partnerId)
      .single();

    if (partnerErr || !partner) {
      return new Response(
        JSON.stringify({ error: "Organization not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const password = randomPassword();
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: email.split("@")[0], invited_to_partner: partnerId },
    });

    if (createErr) {
      console.error("createUser error:", createErr);
      return new Response(
        JSON.stringify({ error: createErr.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkErr) {
      console.error("generateLink error:", linkErr);
    } else {
      const actionLink = (linkData as any)?.properties?.action_link;
      if (actionLink) {
        console.log("[invite-partner] Magic link (stub – log only):", actionLink);
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("partners")
      .update({ user_id: newUser.user.id })
      .eq("id", partnerId);

    if (updateErr) {
      console.error("partners update error:", updateErr);
      return new Response(
        JSON.stringify({ error: "Failed to link user to organization" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert(
      { id: newUser.user.id, email, full_name: email.split("@")[0] },
      { onConflict: "id" }
    );

    if (profileErr) {
      console.error("profiles upsert error:", profileErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        email,
        organizationName: partner.company_name,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error("invite-partner error:", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
