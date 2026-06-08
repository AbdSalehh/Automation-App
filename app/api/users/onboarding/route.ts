import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/shared/auth";
import { prisma } from "@/shared/lib/prisma";
import { z } from "zod";

const onboardingSchema = z.object({
  usagePurpose: z.enum(["learning", "personal", "professional", "team"]),
  organisation: z.string().max(120).optional(),
});

/**
 * POST /api/users/onboarding
 *
 * Saves the user's onboarding answers and marks the account as onboarded.
 * Called from the /onboarding page after the user submits the setup form.
 */
export async function POST(request: NextRequest) {
  const sessionUser = await requireUser().catch(() => null);

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { usagePurpose, organisation } = parsed.data;

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      usagePurpose,
      organisation: organisation ?? null,
      onboardingCompleted: true,
    },
  });

  return NextResponse.json({ success: true });
}
