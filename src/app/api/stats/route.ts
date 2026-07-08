import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

// GET /api/stats - Weekly productivity statistics
export async function GET() {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Tasks created this week
    const tasksThisWeek = await db.task.findMany({
      where: { createdAt: { gte: weekAgo } },
    });

    // Tasks completed this week
    const completedThisWeek = await db.task.findMany({
      where: {
        completedAt: { gte: weekAgo },
        status: "COMPLETED",
      },
    });

    // All pending tasks
    const pendingTasks = await db.task.findMany({
      where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    });

    // Productivity logs for the week
    const logsThisWeek = await db.productivityLog.findMany({
      where: { completedAt: { gte: weekAgo } },
    });

    // Daily completion chart data
    const dailyData: Record<string, number> = {};
    const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = dayNames[d.getDay()];
      dailyData[dayName] = 0;
    }

    logsThisWeek.forEach((log) => {
      const d = new Date(log.completedAt);
      const dayName = dayNames[d.getDay()];
      if (dailyData[dayName] !== undefined) {
        dailyData[dayName]++;
      }
    });

    // Category distribution
    const categoryData: Record<string, number> = {};
    logsThisWeek.forEach((log) => {
      categoryData[log.category] = (categoryData[log.category] || 0) + 1;
    });

    // Priority distribution of pending tasks
    const priorityData: Record<string, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    pendingTasks.forEach((task) => {
      const p = task.priority.toLowerCase();
      if (priorityData[p] !== undefined) priorityData[p]++;
    });

    // Hourly distribution
    const hourlyData: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyData[h] = 0;
    logsThisWeek.forEach((log) => {
      const h = new Date(log.completedAt).getHours();
      hourlyData[h]++;
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
      hourlyData: Object.entries(hourlyData).map(([hour, count]) => ({ hour: `${hour}:00`, count })),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
