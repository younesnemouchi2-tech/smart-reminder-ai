import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";
import ZAI from "z-ai-web-dev-sdk";

export async function GET() {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const logs = await db.productivityLog.findMany({
      where: { userId, completedAt: { gte: weekAgo } },
      orderBy: { completedAt: "desc" },
    });

    const pendingTasks = await db.task.findMany({
      where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    const hourCounts: Record<number, number> = {};
    const categoryCounts: Record<string, number> = {};
    logs.forEach((log) => {
      const h = new Date(log.completedAt).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
      categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

    const summary = `
إحصائيات الأسبوع:
- المهام المكتملة: ${logs.length}
- المهام المعلقة: ${pendingTasks.length}
- ساعة الذروة: ${peakHour ? `${peakHour[0]}:00 (${peakHour[1]} مهام)` : "غير محدد"}
- الفئة الأكثر إنجازاً: ${topCategory ? `${topCategory[0]} (${topCategory[1]} مهام)` : "غير محدد"}
- توزيع أولويات المهام المعلقة: ${pendingTasks.filter(t => t.priority === "URGENT").length} عاجل، ${pendingTasks.filter(t => t.priority === "HIGH").length} عالي، ${pendingTasks.filter(t => t.priority === "MEDIUM").length} متوسط، ${pendingTasks.filter(t => t.priority === "LOW").length} منخفض
`;

    let insights: string;
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content: `أنت مستشار إنتاجية ذكي. حلل بيانات المستخدم وقدّم رؤى ونصائح عملية باللغة العربية. اجعل ردك منظماً ومحفزاً.`
          },
          {
            role: "user",
            content: `${summary}

قدّم رؤى تحليلية في 3 أقسام:
1. تحليل نمط إنتاجيتك (2-3 جمل)
2. نقطة قوة للاستفادة منها (جملة واحدة)
3. 3 نصائح عملية للتحسين هذا الأسبوع (كل واحدة في سطر جديد تبدأ برمز ✨)

اجعل الرد مختصراً ومباشراً ومحفزاً.`
          }
        ],
        thinking: { type: "disabled" },
      });

      insights = completion.choices[0]?.message?.content || generateFallbackInsights();
    } catch (aiError) {
      console.error("AI error:", aiError);
      insights = generateFallbackInsights();
    }

    return NextResponse.json({
      insights,
      stats: {
        totalCompleted: logs.length,
        totalPending: pendingTasks.length,
        peakHour: peakHour ? `${peakHour[0]}:00` : null,
        topCategory: topCategory ? topCategory[0] : null,
      },
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}

function generateFallbackInsights(): string {
  return `📊 **تحليل نمط إنتاجيتك**

بناءً على بياناتك، يبدو أن لديك نشاطاً منتظماً في إنجاز المهام. استمر في هذا الزخم وحاول زيادة عدد المهام في ساعات الذروة.

💪 **نقطة القوة**

التزامك بإنجاز المهام بانتظام يعكس انضباطاً عالياً وإدارة جيدة للوقت.

✨ **نصائح للتحسين:**

✨ ركّز على إنجاز المهام ذات الأولوية العالية في ساعات ذروة طاقتك
✨ خصّص وقتاً محدداً يومياً لمراجعة وتنظيم مهامك
✨ استخدم تقنية بومودورو للحفاظ على التركيز وتجنب الإرهاق`;
}
