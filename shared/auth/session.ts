import { auth } from "./auth";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  onboardingCompleted: boolean;
}

/**
 * Returns the authenticated user or null. Server-only.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const sessionUser = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    onboardingCompleted?: boolean;
  };

  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    image: sessionUser.image,
    role: sessionUser.role ?? "user",
    onboardingCompleted: sessionUser.onboardingCompleted ?? false,
  };
}

/**
 * Returns the authenticated user or throws an Error with a 401-style message.
 * Use inside route handlers and wrap with {@link requireUserResponse} mapping.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
