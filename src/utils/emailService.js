
import { supabase } from '@/lib/customSupabaseClient';

const EXPLICIT_EMAIL_FN_URL = (import.meta.env.VITE_EMAIL_FN_URL || '').trim();
const NETLIFY_EMAIL_FN_URL = '/.netlify/functions/send-lead-email';
const SUPABASE_EMAIL_FN_URL = `${supabase.functionsUrl}/send-lead-notification`;

const isSupabaseFunctionUrl = (url) => /\/functions\/v1\//.test(url);

const getCandidateUrls = () => {
  const urls = [];
  const pushUnique = (url) => {
    const normalized = (url || '').trim();
    if (!normalized || urls.includes(normalized)) return;
    urls.push(normalized);
  };

  // 1) Explicit override from env, 2) Netlify function, 3) Supabase edge function fallback.
  pushUnique(EXPLICIT_EMAIL_FN_URL);
  pushUnique(NETLIFY_EMAIL_FN_URL);
  pushUnique(SUPABASE_EMAIL_FN_URL);

  return urls;
};

const buildHeaders = (url) => {
  const headers = { 'Content-Type': 'application/json' };

  if (isSupabaseFunctionUrl(url)) {
    headers.apikey = supabase.supabaseKey;
    headers.Authorization = `Bearer ${supabase.supabaseKey}`;
  }

  return headers;
};

const parseJsonSafely = (text) => {
  try {
    return JSON.parse(text);
  } catch (_err) {
    return null;
  }
};

/**
 * Triggers an email notification to the admin via Netlify Function + custom SMTP.
 * Call immediately after a lead is inserted into the DB so the payload includes id/created_at.
 * @param {Object} leadData - The lead object inserted into the database (must include id and created_at)
 */
export const notifyAdminNewLead = async (leadData) => {
  if (!leadData) {
    return { success: false, error: 'Missing lead data' };
  }

  const candidateUrls = getCandidateUrls();
  const failures = [];

  try {
    console.log("Triggering email notification for lead:", leadData.id);
    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: buildHeaders(url),
          body: JSON.stringify({ lead: leadData })
        });

        const rawBody = await response.text();
        const parsedBody = parseJsonSafely(rawBody);

        if (response.ok && parsedBody && parsedBody.success !== false) {
          console.log("Email notification processed:", { url, parsedBody });
          return { success: true, data: parsedBody, endpoint: url };
        }

        const errorText = parsedBody?.error || rawBody.slice(0, 200) || 'Unknown error';
        failures.push({ url, status: response.status, error: errorText });
        console.error("Failed email endpoint:", url, response.status, errorText);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push({ url, status: 0, error: message });
        console.error("Error invoking email endpoint:", url, err);
      }
    }

    return {
      success: false,
      error: "All email endpoints failed",
      details: failures
    };
  } catch (err) {
    console.error("Error in notifyAdminNewLead:", err);
    return { success: false, error: err };
  }
};

/**
 * Sends a confirmation email to the user (Placeholder for future implementation)
 */
export const sendConfirmationEmail = async (userEmail, userName, type) => {
  console.log(`User confirmation email logic for ${userEmail} (${type}) - Not implemented yet.`);
};
