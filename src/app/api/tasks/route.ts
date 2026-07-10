import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";

// GET /api/tasks - List current user's tasks
export async function GET() {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const tasks = await db.task.findMany({
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
