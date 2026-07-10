import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";

/**
 * POST /api/notifications/unsubscribe
 * Body: { endpoint }
 *
 * Removes a push subscription for the authenticated user.
 */
export async function POST(request: NextRequest) {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const body = await request.json();
    const { endpoint } = body as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json(
        { error: "endpoint مطلوب" },
        { status: 400 }
      );
    }

    // Only delete if it belongs to the authenticated user
    await db.pushSubscription.deleteMany({
      where: { endpoint, userId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "فشل إلغاء الاشتراك" },
      { status: 500 }
    );
  }
}
