import { NextResponse } from "next/server";

/**
 * GET /api/notifications/vapid-public
 * Returns the public VAPID key for the client to use when subscribing to push notifications.
 */
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID keys not configured", enabled: false },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey, enabled: true });
}
