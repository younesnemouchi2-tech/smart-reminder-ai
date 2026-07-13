import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";

// Calculate the next occurrence date for a recurring task
function getNextRecurrenceDate(currentDue: Date, recurrence: string): Date | null {
  const next = new Date(currentDue);
  switch (recurrence) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      return next;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      return next;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      return next;
    default:
      return null;
  }
}

// Check if a date is the same calendar day as "now" or later.
// We use this so a task due at 9 AM today isn't considered "overdue"
// when the current time is 3 PM — it's still today's task.
function isSameDayOrLater(date: Date, now: Date): boolean {
  // Compare year/month/day — if same day, return true.
  // If date is in a future day, return true.
  if (date.getFullYear() > now.getFullYear()) return true;
  if (date.getFullYear() < now.getFullYear()) return false;
  if (date.getMonth() > now.getMonth()) return true;
  if (date.getMonth() < now.getMonth()) return false;
  return date.getDate() >= now.getDate();
}

/**
 * Auto-advance overdue recurring tasks to the next future occurrence.
 * This is called whenever tasks are fetched, so the user always sees
 * up-to-date due dates without stale past dates cluttering the Today view.
 *
 * Behavior:
 * - For a recurring task whose dueDate is in the past and not yet completed,
 *   we keep advancing the dueDate by one recurrence interval until it's today
 *   or in the future.
 * - If recurrenceEnd has already passed, we convert the task to non-recurring
 *   (recurrence = "NONE") so it just shows as a regular overdue task.
 * - We respect recurrenceEnd: if the next occurrence would be after
 *   recurrenceEnd, we convert the task to non-recurring.
 * - We do NOT touch non-recurring tasks (recurrence = "NONE") — those stay
 *   with their original due date so the user can see them as overdue.
 */
async function autoAdvanceRecurringTasks(userId: string, tasks: Array<{
  id: string;
  dueDate: Date | null;
  recurrence: string;
  recurrenceEnd: Date | null;
  status: string;
}>): Promise<void> {
  const now = new Date();
  const advanceUpdates: Array<{ id: string; newDue: Date }> = [];
  const endRecurrenceUpdates: string[] = [];

  for (const task of tasks) {
    if (task.status === "COMPLETED") continue;
    if (task.recurrence === "NONE") continue;
    // If a recurring task has no dueDate, set it to now so it shows in Today
    if (!task.dueDate) {
      advanceUpdates.push({ id: task.id, newDue: new Date() });
      continue;
    }

    let currentDue = new Date(task.dueDate);
    // If the task is due today or in the future, leave it alone.
    // We compare by calendar DAY, not by exact timestamp — a task due at
    // 9 AM today should still show in Today even if it's now 3 PM.
    if (isSameDayOrLater(currentDue, now)) continue;

    // Check if recurrenceEnd has already passed → convert to non-recurring
    if (task.recurrenceEnd && task.recurrenceEnd.getTime() < now.getTime()) {
      endRecurrenceUpdates.push(task.id);
      continue;
    }

    // Keep advancing by one interval until we reach today or a future day.
    // We use day-level comparison (not exact timestamp) so a task due
    // yesterday at 9 AM advances to today at 9 AM (not to tomorrow).
    let iterations = 0;
    let recurrenceEnded = false;
    while (!isSameDayOrLater(currentDue, now) && iterations < 365) {
      const next = getNextRecurrenceDate(currentDue, task.recurrence);
      if (!next) break;
      // Respect recurrenceEnd: if next occurrence is after recurrenceEnd,
      // convert to non-recurring
      if (task.recurrenceEnd && next.getTime() > task.recurrenceEnd.getTime()) {
        recurrenceEnded = true;
        break;
      }
      currentDue = next;
      iterations++;
    }

    if (recurrenceEnded) {
      endRecurrenceUpdates.push(task.id);
    } else if (currentDue.getTime() !== task.dueDate.getTime()) {
      // Only update if we actually advanced the date
      advanceUpdates.push({ id: task.id, newDue: currentDue });
    }
  }

  // Apply advance updates
  if (advanceUpdates.length > 0) {
    await Promise.all(
      advanceUpdates.map((u) =>
        db.task.update({
          where: { id: u.id },
          data: { dueDate: u.newDue, lastReminderSent: null },
        })
      )
    );
  }

  // Convert expired recurrence tasks to non-recurring
  if (endRecurrenceUpdates.length > 0) {
    await db.task.updateMany({
      where: { id: { in: endRecurrenceUpdates } },
      data: { recurrence: "NONE" },
    });
  }
}

// GET /api/tasks - List current user's tasks
export async function GET() {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    // First fetch — get all tasks
    let tasks = await db.task.findMany({
      where: { userId },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Auto-advance overdue recurring tasks to their next future occurrence
    await autoAdvanceRecurringTasks(
      userId,
      tasks.map((t) => ({
        id: t.id,
        dueDate: t.dueDate,
        recurrence: t.recurrence,
        recurrenceEnd: t.recurrenceEnd,
        status: t.status,
      }))
    );

    // If we advanced any tasks, re-fetch to return the updated due dates
    // (We do this only when needed to keep the common case fast.)
    // To keep things simple and consistent, we always re-fetch after the
    // auto-advance call — the cost is one extra DB query, which is acceptable.
    tasks = await db.task.findMany({
      where: { userId },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const body = await request.json();
    const {
      title,
      description,
      priority,
      category,
      dueDate,
      suggestedTime,
      aiSuggestion,
      recurrence,
      recurrenceEnd,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Validate recurrence
    const validRecurrence = ["NONE", "DAILY", "WEEKLY", "MONTHLY"].includes(recurrence)
      ? recurrence
      : "NONE";

    // For recurring tasks (DAILY/WEEKLY/MONTHLY) without a dueDate,
    // default the dueDate to now so the task shows up in the Today view
    // and the recurrence engine has a starting point.
    let dueDateObj = dueDate ? new Date(dueDate) : null;
    if (!dueDateObj && validRecurrence !== "NONE") {
      dueDateObj = new Date();
    }

    const task = await db.task.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "MEDIUM",
        category: category?.trim() || "general",
        dueDate: dueDateObj,
        originalDueDate: dueDateObj,
        suggestedTime: suggestedTime || null,
        aiSuggestion: aiSuggestion || null,
        recurrence: validRecurrence,
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
