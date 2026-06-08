/**
 * Supabase Edge Function – contact-form
 * -------------------------------------
 * Runtime: Deno (Supabase Edge Functions v2)
 *
 * Receives a contact form submission, validates the payload,
 * saves it to the `contact_messages` table (via the service-role
 * client so RLS is bypassed), and sends an email notification
 * using the Resend API.
 *
 * Deploy:
 *   supabase functions deploy contact-form --no-verify-jwt
 *
 * Environment secrets (set via Supabase Dashboard > Edge Functions > Secrets):
 *   SUPABASE_URL            – your project URL
 *   SUPABASE_SERVICE_ROLE_KEY – service-role key (never expose to client)
 *   RESEND_API_KEY          – from resend.com
 *   NOTIFICATION_EMAIL      – recipient for admin alerts
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ─────────────────────────────────────────────────────────

interface ContactPayload {
  full_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ── CORS headers ──────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── Validation ────────────────────────────────────────────────────

function validatePayload(data: unknown): data is ContactPayload {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.full_name === "string" && d.full_name.trim().length >= 2 &&
    typeof d.email    === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) &&
    typeof d.subject  === "string" && d.subject.trim().length >= 3 &&
    typeof d.message  === "string" && d.message.trim().length >= 10
  );
}

// ── Email sender via Resend ────────────────────────────────────────

async function sendEmailNotification(
  payload: ContactPayload,
  apiKey: string,
  recipient: string
): Promise<void> {
  const body = {
    from: "Diyala Foundation <noreply@diyalafoundation.org>",
    to: [recipient],
    subject: `[Contact Form] ${payload.subject}`,
    html: `
      <div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color:#5BC8E8;">New Contact Message</h2>
        <table style="border-collapse:collapse; width:100%;">
          <tr><td style="padding:8px; font-weight:bold;">Name:</td><td>${payload.full_name}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Email:</td><td>${payload.email}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Phone:</td><td>${payload.phone ?? "—"}</td></tr>
          <tr><td style="padding:8px; font-weight:bold;">Subject:</td><td>${payload.subject}</td></tr>
        </table>
        <hr/>
        <p style="white-space:pre-wrap;">${payload.message}</p>
        <p style="color:#888; font-size:12px;">
          Sent via Diyala Foundation website contact form.
        </p>
      </div>
    `,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[contact-form] Resend error:", err);
    // Non-blocking – don't throw, the record is already saved
  }
}

// ── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" } satisfies ApiResponse),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: unknown = await req.json();

    if (!validatePayload(payload)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or incomplete form data" } satisfies ApiResponse),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialise admin client (service-role bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Persist to database
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        full_name:  payload.full_name.trim(),
        email:      payload.email.trim().toLowerCase(),
        phone:      payload.phone?.trim() ?? null,
        subject:    payload.subject.trim(),
        message:    payload.message.trim(),
        user_agent: req.headers.get("user-agent"),
        // ip_address extracted by Supabase automatically for edge functions
      });

    if (dbError) {
      console.error("[contact-form] DB error:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save message" } satisfies ApiResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fire-and-forget email notification
    const resendKey     = Deno.env.get("RESEND_API_KEY");
    const notifyEmail   = Deno.env.get("NOTIFICATION_EMAIL");
    if (resendKey && notifyEmail) {
      await sendEmailNotification(payload, resendKey, notifyEmail);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Message received. We will get back to you soon.",
      } satisfies ApiResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[contact-form] Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" } satisfies ApiResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
