
const EMAIL_FN_URL = import.meta.env.VITE_EMAIL_FN_URL || '/.netlify/functions/send-lead-email';

/**
 * Triggers an email notification to the admin via Netlify Function + custom SMTP.
 * Call immediately after a lead is inserted into the DB so the payload includes id/created_at.
 * @param {Object} leadData - The lead object inserted into the database (must include id and created_at)
 */
export const notifyAdminNewLead = async (leadData) => {
  try {
    console.log("Triggering email notification for lead:", leadData.id);

    const response = await fetch(EMAIL_FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: leadData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to invoke email function:", response.status, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log("Email notification processed:", data);
    return { success: true, data };
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
