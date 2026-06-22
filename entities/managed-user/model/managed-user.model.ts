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
  lastSeenAt: string | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

export type RoleFilter = "all" | "user" | "admin";

export type StatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "pending"
  | "rejected"
  | "locked";

export interface ListUsersParams {
  page: number;
  limit: number;
  search: string;
  role: RoleFilter;
  status: StatusFilter;
}
