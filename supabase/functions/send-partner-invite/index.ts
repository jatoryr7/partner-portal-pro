import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PartnerInviteRequest {
  contactName: string;
  contactEmail: string;
  companyName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION CHECK ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with the user's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== AUTHORIZATION CHECK - Admin role required ==========
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError) {
      console.error("Role check error:", rolesError.message);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!roles || roles.length === 0) {
      console.error("User lacks admin role:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Admin user authorized:", user.id);

    // ========== VALIDATE REQUEST BODY ==========
    const { contactName, contactEmail, companyName }: PartnerInviteRequest = await req.json();

    if (!contactName || !contactEmail || !companyName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // ========== SEND EMAIL ==========
    // Get the app URL from environment or use a default
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') 
      || 'https://your-app.lovable.app';
    
    const signupUrl = `${appUrl}/auth?signup=true&company=${encodeURIComponent(companyName)}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Our Partner Program!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${contactName},</p>
          
          <p>Great news! Your partnership agreement with us is now finalized. We're excited to officially welcome <strong>${companyName}</strong> to our partner program.</p>
          
          <p>To get started, please complete your partner onboarding by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signupUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Start Partner Onboarding
            </a>
          </div>
          
          <p>During onboarding, you'll be able to:</p>
          <ul style="padding-left: 20px;">
            <li>Set up your company profile</li>
            <li>Select your preferred marketing channels</li>
            <li>Upload your creative assets and brand materials</li>
            <li>Add team members and stakeholders</li>
          </ul>
          
          <p>If you have any questions, feel free to reach out to your account manager.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The Partnership Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>This email was sent to ${contactEmail} because your company was added as a partner.</p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Partner Portal <onboarding@resend.dev>",
        to: [contactEmail],
        subject: `Welcome to our Partner Program, ${companyName}!`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Partner invite email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-partner-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);