import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";

export async function GET() {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const tasksThisWeek = await db.task.findMany({
      where: { userId, createdAt: { gte: weekAgo } },
    });

    const completedThisWeek = await db.task.findMany({
      where: {
        userId,
        completedAt: { gte: weekAgo },
        status: "COMPLETED",
      },
    });

    const pendingTasks = await db.task.findMany({
      where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });

    const logsThisWeek = await db.productivityLog.findMany({
      where: { userId, completedAt: { gte: weekAgo } },
    });

    const dailyData: Record<string, number> = {};
    const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyData[dayNames[d.getDay()]] = 0;
    }

    logsThisWeek.forEach((log) => {
      const d = new Date(log.completedAt);
      const dayName = dayNames[d.getDay()];
      if (dailyData[dayName] !== undefined) dailyData[dayName]++;
    });

    const categoryData: Record<string, number> = {};
    logsThisWeek.forEach((log) => {
      categoryData[log.category] = (categoryData[log.category] || 0) + 1;
    });

    const priorityData: Record<string, number> = {
      urgent: 0, high: 0, medium: 0, low: 0,
    };
    pendingTasks.forEach((task) => {
      const p = task.priority.toLowerCase();
      if (priorityData[p] !== undefined) priorityData[p]++;
    });

    const completionRate = tasksThisWeek.length > 0
      ? Math.round((completedThisWeek.length / tasksThisWeek.length) * 100)
      : 0;

    return NextResponse.json({
      summary: {
        totalCreated: tasksThisWeek.length,
        totalCompleted: completedThisWeek.length,
        totalPending: pendingTasks.length,
        completionRate,
      },
      dailyData: Object.entries(dailyData).map(([day, count]) => ({ day, count })),
      categoryData: Object.entries(categoryData).map(([category, count]) => ({ category, count })),
      priorityData: Object.entries(priorityData).map(([priority, count]) => ({ priority, count })),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
