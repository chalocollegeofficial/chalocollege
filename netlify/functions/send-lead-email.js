import nodemailer from "nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...corsHeaders },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "ok" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let lead;
  try {
    const parsed = JSON.parse(event.body || "{}");
    lead = parsed.lead;
  } catch (_err) {
    return json(400, { error: "Invalid JSON" });
  }

  if (!lead) {
    return json(400, { error: "Missing lead object" });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const to =
    process.env.SMTP_TO ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER;
  const secure =
    process.env.SMTP_SECURE === "true" || Number(port) === 465;

  if (!host || !user || !pass || !from || !to) {
    return json(500, {
      error:
        "SMTP env vars missing. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TO",
    });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const createdAt = lead.created_at ? new Date(lead.created_at) : new Date();
  const subject = `New lead from ${lead.page_from || "website"}`;

  const text = `
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
      text,
      html,
    });

    return json(200, {
      success: true,
      messageId: info.messageId,
      envelope: info.envelope,
    });
  } catch (error) {
    console.error("SMTP send error:", error);
    return json(500, { success: false, error: String(error) });
  }
};
