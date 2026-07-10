import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";

// Calculate the next occurrence date for a recurring task
function getNextRecurrenceDate(
  currentDue: Date,
  recurrence: string
): Date | null {
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

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      category,
      dueDate,
      suggestedTime,
      aiSuggestion,
      recurrence,
      recurrenceEnd,
    } = body;

    const existingTask = await db.task.findFirst({ where: { id, userId } });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) {
      data.status = status;
      if (status === "COMPLETED" && !existingTask.completedAt) {
        data.completedAt = new Date();
        data.lastReminderSent = null;
        await db.productivityLog.create({
          data: {
            userId,
            taskTitle: existingTask.title,
            category: existingTask.category,
            priority: existingTask.priority,
            completedAt: new Date(),
          },
        });
      } else if (status !== "COMPLETED") {
        data.completedAt = null;
      }
    }
    if (priority !== undefined) data.priority = priority;
    if (category !== undefined) data.category = category;
    if (dueDate !== undefined) {
      const dueObj = dueDate ? new Date(dueDate) : null;
      data.dueDate = dueObj;
      if (!existingTask.originalDueDate) {
        data.originalDueDate = dueObj;
      }
    }
    if (suggestedTime !== undefined) data.suggestedTime = suggestedTime;
    if (aiSuggestion !== undefined) data.aiSuggestion = aiSuggestion;
    if (recurrence !== undefined) {
      const validRecurrence = ["NONE", "DAILY", "WEEKLY", "MONTHLY"].includes(recurrence)
        ? recurrence
        : "NONE";
      data.recurrence = validRecurrence;
    }
    if (recurrenceEnd !== undefined) {
      data.recurrenceEnd = recurrenceEnd ? new Date(recurrenceEnd) : null;
    }

    const task = await db.task.update({
      where: { id },
      data,
    });

    // If task is recurring and was just completed, create the next occurrence
    if (
      status === "COMPLETED" &&
      existingTask.recurrence &&
      existingTask.recurrence !== "NONE" &&
      existingTask.dueDate
    ) {
      // Check if recurrence end date has passed
      const recurrenceEndDate = existingTask.recurrenceEnd;
      if (!recurrenceEndDate || recurrenceEndDate > new Date()) {
        const nextDue = getNextRecurrenceDate(
          existingTask.dueDate,
          existingTask.recurrence
        );
        if (nextDue && (!recurrenceEndDate || nextDue <= recurrenceEndDate)) {
          await db.task.create({
            data: {
              userId,
              title: existingTask.title,
              description: existingTask.description,
              priority: existingTask.priority,
              category: existingTask.category,
              dueDate: nextDue,
              originalDueDate: existingTask.originalDueDate || existingTask.dueDate,
              suggestedTime: existingTask.suggestedTime,
              aiSuggestion: existingTask.aiSuggestion,
              recurrence: existingTask.recurrence,
              recurrenceEnd: existingTask.recurrenceEnd,
              status: "PENDING",
            },
          });
        }
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const { id } = await params;
    const existingTask = await db.task.findFirst({ where: { id, userId } });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
