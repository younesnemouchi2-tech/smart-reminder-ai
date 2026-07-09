import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";

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
    const { title, description, status, priority, category, dueDate, suggestedTime, aiSuggestion } = body;

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
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (suggestedTime !== undefined) data.suggestedTime = suggestedTime;
    if (aiSuggestion !== undefined) data.aiSuggestion = aiSuggestion;

    const task = await db.task.update({
      where: { id },
      data,
    });

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
