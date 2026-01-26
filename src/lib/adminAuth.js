// Simplified admin check - now purely based on authentication existence
// This file is kept to maintain import compatibility but logic is trivialized
export const checkAdminAccess = async (userId) => {
  // If we have a userId, we assume they are an admin in this simplified mode
  // No database checks against admin_users table anymore
  return !!userId;
};