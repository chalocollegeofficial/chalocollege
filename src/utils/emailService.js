
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Triggers an email notification to the admin via Supabase Edge Function
 * This function should be called immediately after a lead is successfully inserted into the DB.
 * 
 * @param {Object} leadData - The lead object inserted into the database (must include id and created_at)
 */
export const notifyAdminNewLead = async (leadData) => {
  try {
    console.log("Triggering email notification for lead:", leadData.id);
    
    const { data, error } = await supabase.functions.invoke('send-lead-notification', {
      body: { lead: leadData }
    });

    if (error) {
        console.error("Failed to invoke edge function:", error);
        return { success: false, error };
    } 

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
