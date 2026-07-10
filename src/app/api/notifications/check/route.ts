import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";
import webpush from "web-push";

/**
 * POST /api/notifications/check
 *
 * Called periodically by the client (every 60s while app is open).
 * Checks for tasks due in the next 5 minutes that haven't had a reminder sent yet,
 * and sends push notifications to all of the user's devices.
 *
 * Also handles task recurrence: when a recurring task's due date has passed,
 * the task is NOT auto-completed — instead, we create the next occurrence
 * when the user manually completes the task (handled in PATCH /api/tasks/[id]).
 *
 * This endpoint also marks `lastReminderSent` so we don't spam the user.
 */
export async function POST() {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  // Even without VAPID keys, we still track which reminders were sent
  // so we can show local notifications on the client side.
  const hasVapid = !!(publicKey && privateKey);
  if (hasVapid) {
    webpush.setVapidDetails(
      "mailto:noreply@smart-reminder.example",
      publicKey!,
      privateKey!
    );
  }

  try {
    const now = new Date();
    // Look 5 minutes ahead
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find pending tasks due within the next 5 minutes that haven't been reminded
    const dueTasks = await db.task.findMany({
      where: {
        userId,
        status: { not: "COMPLETED" },
        dueDate: {
          gte: now,
          lte: fiveMinutesFromNow,
        },
        OR: [
          { lastReminderSent: null },
          { lastReminderSent: { lt: new Date(now.getTime() - 30 * 60 * 1000) } },
        ],
      },
      take: 10,
    });

    if (dueTasks.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, dueTasks: [] });
    }

    // Mark these as reminded
    await db.task.updateMany({
      where: { id: { in: dueTasks.map((t) => t.id) } },
      data: { lastReminderSent: now },
    });

    // Send push notifications if VAPID is configured
    let pushSent = 0;
    if (hasVapid) {
      const subscriptions = await db.pushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length > 0) {
        for (const task of dueTasks) {
          const dueDate = task.dueDate!;
          const minutesUntil = Math.max(
            0,
            Math.round((dueDate.getTime() - now.getTime()) / 60000)
          );
          const payload = JSON.stringify({
            title: "🔔 تذكير",
            body:
              minutesUntil <= 0
                ? `الآن: ${task.title}`
                : `بعد ${minutesUntil} دقيقة: ${task.title}`,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: `task-${task.id}`,
            data: { url: "/", taskId: task.id },
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
          pushSent += results.filter((r) => r.status === "fulfilled").length;
        }
      }
    }

    // Return the due tasks so the client can show local notifications too
    return NextResponse.json({
      ok: true,
      sent: pushSent,
      dueTasks: dueTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate?.toISOString(),
        priority: t.priority,
        recurrence: t.recurrence,
      })),
    });
  } catch (error) {
    console.error("Check notifications error:", error);
    return NextResponse.json(
      { error: "فشل فحص التذكيرات" },
      { status: 500 }
    );
  }
}
