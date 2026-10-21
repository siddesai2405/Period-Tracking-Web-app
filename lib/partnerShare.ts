import type { Cycle, LogEntry, PCOSProfile, Profile } from "@/lib/store";

export interface PartnerShare {
  id: string;
  token: string;
  partnerName: string;
  partnerEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
}

export type PartnerPublicProfile = Pick<
  Profile,
  | "name"
  | "avgCycleLength"
  | "avgPeriodLength"
  | "birthYear"
  | "accentTheme"
  | "dietPreference"
  | "healthGoal"
  | "activityLevel"
  | "height"
  | "weight"
  | "medicalConditions"
  | "foodAllergies"
  | "stressLevel"
>;

export interface PartnerDashboardPayload {
  share: Pick<PartnerShare, "partnerName" | "createdAt" | "updatedAt">;
  profile: PartnerPublicProfile;
  cycles: Cycle[];
  logs: Record<string, LogEntry>;
  pcosProfile: PCOSProfile;
}

export function partnerSharePath(token: string) {
  return `/partner/${token}`;
}

export function partnerShareUrl(token: string) {
  if (typeof window === "undefined") return partnerSharePath(token);
  return `${window.location.origin}${partnerSharePath(token)}`;
}
