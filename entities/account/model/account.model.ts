export interface UpdateProfilePayload {
  name?: string;
  image?: string | null;
}

export interface UpdatedProfile {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
