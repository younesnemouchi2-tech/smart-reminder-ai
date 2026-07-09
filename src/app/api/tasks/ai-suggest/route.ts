import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/session";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  const userIdOrError = await getAuthenticatedUserId();
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  try {
    const body = await request.json();
    const { title, description, priority, category } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const recentLogs = await db.productivityLog.findMany({
      where: { userId },
      take: 50,
      orderBy: { completedAt: "desc" },
    });

    const hourCounts: Record<number, number> = {};
    recentLogs.forEach((log) => {
      const hour = new Date(log.completedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => `${h}:00`);

    const patternSummary = recentLogs.length > 0
      ? `أكملت ${recentLogs.length} مهمة مؤخراً. ساعات ذروتك: ${peakHours.join("، ") || "غير محدد بعد"}.`
      : "لا توجد بيانات سابقة كافية، سيتم اقتراح أوقات عامة.";

    let suggestedTime: string | null = null;

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content: `أنت مساعد ذكي متخصص في إدارة الوقت والإنتاجية. مهمتك تحليل المهام واقتراح أفضل وقت لإنجازها. أجب باللغة العربية فقط وبصيغة JSON صالحة.`
          },
          {
            role: "user",
            content: `حلل هذه المهمة واقترح أفضل وقت لإنجازها:
العنوان: ${title}
${description ? `الوصف: ${description}` : ""}
الأولوية: ${priority || "متوسطة"}
الفئة: ${category || "عام"}

بيانات الإنتاجية: ${patternSummary}

أرجع JSON بالصيغة التالية فقط بدون أي نص إضافي:
{
  "suggestedTime": "HH:MM (بصيغة 24 ساعة)",
  "reason": "سبب اختيار هذا الوقت (جملة أو جملتين)",
  "tip": "نصيحة قصيرة لإنجاز المهمة بكفاءة",
  "estimatedDuration": "المدة المقدرة بالدقائق"
}`
          }
        ],
        thinking: { type: "disabled" },
      });

      const aiResponse = completion.choices[0]?.message?.content || "";
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          suggestedTime = parsed.suggestedTime || null;
          const formattedSuggestion = [
            parsed.reason ? `💡 ${parsed.reason}` : "",
            parsed.tip ? `✨ ${parsed.tip}` : "",
            parsed.estimatedDuration ? `⏱️ المدة المقدرة: ${parsed.estimatedDuration} دقيقة` : "",
          ].filter(Boolean).join("\n");

          return NextResponse.json({
            suggestedTime,
            suggestion: formattedSuggestion,
            patternSummary,
          });
        } catch {
          // JSON parse failed
        }
      }
    } catch (aiError) {
      console.error("AI error:", aiError);
    }

    const fallback = generateFallbackSuggestion(title, priority, category, peakHours);
    return NextResponse.json({
      suggestedTime: fallback.time,
      suggestion: fallback.suggestion,
      patternSummary,
    });
  } catch (error) {
    console.error("Error in AI suggest:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}

function generateFallbackSuggestion(
  title: string,
  priority: string,
  category: string,
  peakHours: string[]
): { time: string; suggestion: string } {
  let time = "09:00";
  let reason = "";

  if (priority === "URGENT" || priority === "HIGH") {
    time = peakHours[0]?.replace(":00", ":00") || "09:00";
    reason = "هذه المهمة ذات أولوية عالية، يُفضل إنجازها في وقت ذروة طاقتك.";
  } else if (category === "work" || category === "عمل") {
    time = "10:00";
    reason = "مهام العمل تُنجز بكفاءة في الصباح بعد الاستيقاظ.";
  } else if (category === "study" || category === "دراسة") {
    time = "08:00";
    reason = "الدراسة تكون أكثر فعالية في الصباح الباكر عندما يكون العقل منتعماً.";
  } else if (category === "health" || category === "صحة") {
    time = "06:30";
    reason = "الرياضة الصباحية تنشط الجسم وتحسّز المزاج طوال اليوم.";
  } else if (category === "personal" || category === "شخصي") {
    time = "19:00";
    reason = "المهام الشخصية مناسبة للمساء بعد انتهاء العمل.";
  } else {
    time = peakHours[0]?.replace(":00", ":00") || "14:00";
    reason = "تم اختيار وقت مناسب بناءً على نمط إنتاجيتك السابق.";
  }

  const tips = [
    "قسّم المهمة إلى خطوات صغيرة لإنجازها بسهولة.",
    "استخدم تقنية بومودورو: 25 دقيقة تركيز ثم 5 دقائق راحة.",
    "أبعد المشتتات وأغلق الإشعارات أثناء العمل.",
    "ابدأ بأصعب جزء أولاً عندما تكون طاقتك في ذروتها.",
  ];
  const tip = tips[Math.floor(Math.random() * tips.length)];

  return {
    time,
    suggestion: `💡 ${reason}\n✨ ${tip}`,
  };
}
