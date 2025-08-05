// src/utils/roleCheck.ts

// Define roles that have community leader privileges
const COMMUNITY_LEADER_ROLES = ["CommunityLeader", "SystemAdmin"];

export const hasCommunityLeaderAccess = (role?: string): boolean => {
  if (!role) return false;
  return COMMUNITY_LEADER_ROLES.includes(role);
};

// Optional: For more complex role hierarchies
export const hasModerationPrivileges = (user: User | null): boolean => {
  if (!user) return false;
  
  // Add your custom logic here
  return (
    user.Role === "SystemAdmin" ||
    user.Role === "CommunityLeader" ||
    user.UserType === "Admin"
  );
};