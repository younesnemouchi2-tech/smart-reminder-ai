import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";
import webpush from "web-push";

/**
 * POST /api/notifications/test
 *
 * Sends a test push notification to all of the user's subscribed devices.
 * Useful for verifying the setup works.
 */
export async function POST() {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: "VAPID keys not configured on server" },
      { status: 503 }
    );
  }

  webpush.setVapidDetails(
    "mailto:noreply@smart-reminder.example",
    publicKey,
    privateKey
  );

  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "لا يوجد أجهزة مسجلة للإشعارات" },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: "🔔 تذكير ذكي",
      body: "هذه رسالة تجريبية — الإشعارات تعمل بنجاح!",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "test-notification",
      data: { url: "/" },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      ok: true,
      sent: succeeded,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json(
      { error: "فشل إرسال الإشعار" },
      { status: 500 }
    );
  }
}
