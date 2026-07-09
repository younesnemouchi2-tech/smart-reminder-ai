import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Generates a password reset token. In production with SMTP configured, the
 * token would be emailed to the user as a link. In preview/dev (no SMTP),
 * we return the token directly so the caller can complete the flow via the
 * /auth/reset-password?token=... page.
 *
 * Always returns 200 to prevent email enumeration attacks.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    // Always return success to prevent email enumeration
    const genericSuccess = {
      ok: true,
      message: "إذا كان البريد مسجلاً لدينا، فقد تم إنشاء رابط إعادة التعيين.",
    };

    if (!user) {
      return NextResponse.json(genericSuccess);
    }

    // Invalidate any previous unused tokens for this user
    await db.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure random token (URL-safe)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordReset.create({
      data: { token, userId: user.id, expiresAt },
    });

    // In production with SMTP configured, we would send an email here.
    // For preview/dev, return the token so the user can complete the flow.
    const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
    if (hasSmtp) {
      // TODO: send email with link `${origin}/auth/reset-password?token=${token}`
      return NextResponse.json(genericSuccess);
    }

    // Dev/preview: return the token so the client can redirect to the reset page
    return NextResponse.json({
      ok: true,
      message: "تم إنشاء رابط إعادة التعيين.",
      resetToken: token,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "حدث خطأ. حاول مرة أخرى." }, { status: 500 });
  }
}
