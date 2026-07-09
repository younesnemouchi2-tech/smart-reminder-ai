import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password
 * Body: { token: string, password: string }
 *
 * Verifies the reset token, sets the new password, and invalidates the token
 * (plus all of the user's existing tokens for safety).
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: "الرمز وكلمة المرور الجديدة مطلوبان" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
    }

    const reset = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset || reset.used || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "الرمز غير صالح أو منتهي الصلاحية" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Update password + mark token as used in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      db.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ]);

    // Invalidate all other unused tokens for this user (security)
    await db.passwordReset.updateMany({
      where: { userId: reset.userId, used: false },
      data: { used: true },
    });

    return NextResponse.json({
      ok: true,
      message: "تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "حدث خطأ. حاول مرة أخرى." }, { status: 500 });
  }
}
