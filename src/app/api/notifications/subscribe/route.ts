import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";

/**
 * POST /api/notifications/subscribe
 * Body: { endpoint, p256dh, auth }
 *
 * Saves a push subscription for the authenticated user.
 * The subscription is sent by the browser after the user grants notification permission.
 */
export async function POST(request: NextRequest) {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const body = await request.json();
    const { endpoint, keys } = body as {
      endpoint: string;
      keys?: { p256dh: string; auth: string };
    };

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        { error: "endpoint مطلوب" },
        { status: 400 }
      );
    }

    if (!keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "keys.p256dh و keys.auth مطلوبان" },
        { status: 400 }
      );
    }

    // Upsert: if subscription already exists for this endpoint, update it
    const subscription = await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get("user-agent")?.slice(0, 255) || null,
      },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get("user-agent")?.slice(0, 255) || null,
      },
    });

    return NextResponse.json({ ok: true, id: subscription.id });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "فشل تسجيل الاشتراك" },
      { status: 500 }
    );
  }
}
