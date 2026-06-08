export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "user" | "admin";
  onboardingCompleted: boolean;
  usagePurpose: "learning" | "personal" | "professional" | "team" | null;
  organisation: string | null;
}
