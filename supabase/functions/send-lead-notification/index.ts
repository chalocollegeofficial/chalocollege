import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.9";

type LeadPayload = {
  id?: number | string;
  user_name?: string;
  email?: string;
  phone_number?: string;
  city?: string;
  course_of_interest?: string;
  preferred_colleges?: string;
  message?: string;
  page_from?: string;
  created_at?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let lead: LeadPayload | undefined;
  try {
    const { lead: incomingLead } = await req.json();
    lead = incomingLead;
  } catch (_err) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!lead) {
    return jsonResponse({ error: "Missing lead object in body" }, 400);
  }

  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") || "587");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const from = Deno.env.get("SMTP_FROM") || user;
  const to =
    Deno.env.get("SMTP_TO") ||
    Deno.env.get("ADMIN_EMAIL") ||
    Deno.env.get("SMTP_USER");

  if (!host || !user || !pass || !from || !to) {
    return jsonResponse(
      { error: "SMTP env vars missing (SMTP_HOST/USER/PASS/TO/FROM)" },
      500,
    );
  }

  const secure =
    Deno.env.get("SMTP_SECURE") === "true" || Number(port) === 465 ? true : false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const createdAt = lead.created_at
    ? new Date(lead.created_at)
    : new Date();

  const subject = `New lead from ${lead.page_from || "website"}`;
  const plainText = `
New lead received
-----------------
Name: ${lead.user_name || "N/A"}
Email: ${lead.email || "N/A"}
Phone: ${lead.phone_number || "N/A"}
City: ${lead.city || "N/A"}
Course: ${lead.course_of_interest || "N/A"}
Preferred Colleges: ${lead.preferred_colleges || "N/A"}
Source: ${lead.page_from || "N/A"}
Message: ${lead.message || "N/A"}
Submitted At: ${createdAt.toISOString()}
Lead ID: ${lead.id || "N/A"}
`.trim();

  const html = `
    <h2>New lead received</h2>
    <ul>
      <li><strong>Name:</strong> ${lead.user_name || "N/A"}</li>
      <li><strong>Email:</strong> ${lead.email || "N/A"}</li>
      <li><strong>Phone:</strong> ${lead.phone_number || "N/A"}</li>
      <li><strong>City:</strong> ${lead.city || "N/A"}</li>
      <li><strong>Course:</strong> ${lead.course_of_interest || "N/A"}</li>
      <li><strong>Preferred Colleges:</strong> ${lead.preferred_colleges || "N/A"}</li>
      <li><strong>Source:</strong> ${lead.page_from || "N/A"}</li>
      <li><strong>Message:</strong> ${lead.message || "N/A"}</li>
      <li><strong>Submitted At:</strong> ${createdAt.toISOString()}</li>
      <li><strong>Lead ID:</strong> ${lead.id || "N/A"}</li>
    </ul>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: plainText,
      html,
    });

    return jsonResponse({
      success: true,
      messageId: info.messageId,
      envelope: info.envelope,
    });
  } catch (error) {
    console.error("SMTP send error:", error);
    return jsonResponse({ success: false, error: String(error) }, 500);
  }
});
