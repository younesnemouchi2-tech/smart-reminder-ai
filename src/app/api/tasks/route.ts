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

/**
 * Auto-advance overdue recurring tasks to the next future occurrence.
 * This is called whenever tasks are fetched, so the user always sees
 * up-to-date due dates without stale past dates cluttering the Today view.
 *
 * Behavior:
 * - For a recurring task whose dueDate is in the past and not yet completed,
 *   we keep advancing the dueDate by one recurrence interval until it's today
 *   or in the future.
 * - We respect recurrenceEnd: if the next occurrence would be after
 *   recurrenceEnd, we leave the task as-is (it's effectively done).
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
  const updates: Array<{ id: string; newDue: Date }> = [];

  for (const task of tasks) {
    if (task.status === "COMPLETED") continue;
    if (!task.dueDate) continue;
    if (task.recurrence === "NONE") continue;

    let currentDue = new Date(task.dueDate);
    // If the task is already due today or in the future, leave it alone
    if (currentDue.getTime() >= now.getTime()) continue;

    // Keep advancing by one interval until we reach today or later
    // (cap at 365 iterations to prevent infinite loops in pathological cases)
    let iterations = 0;
    while (currentDue.getTime() < now.getTime() && iterations < 365) {
      const next = getNextRecurrenceDate(currentDue, task.recurrence);
      if (!next) break;
      // Respect recurrenceEnd
      if (task.recurrenceEnd && next.getTime() > task.recurrenceEnd.getTime()) {
        // The recurrence has ended — leave the task at its last due date
        currentDue = new Date(task.dueDate); // restore
        break;
      }
      currentDue = next;
      iterations++;
    }

    // Only update if we actually advanced the date
    if (currentDue.getTime() !== task.dueDate.getTime()) {
      updates.push({ id: task.id, newDue: currentDue });
    }
  }

  // Apply updates in parallel (small batch — should be fine for typical usage)
  if (updates.length > 0) {
    await Promise.all(
      updates.map((u) =>
        db.task.update({
          where: { id: u.id },
          data: { dueDate: u.newDue, lastReminderSent: null },
        })
      )
    );
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

    const dueDateObj = dueDate ? new Date(dueDate) : null;

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
