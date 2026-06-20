export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "user" | "admin";
  isActive: boolean;
  isLocked: boolean;
  approvalStatus: ApprovalStatus;
  onboardingCompleted: boolean;
  createdAt: string;
}
