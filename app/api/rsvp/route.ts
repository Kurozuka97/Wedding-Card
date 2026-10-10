import { NextResponse } from "next/server";
import { getDb, RSVPS_COLLECTION } from "@/lib/firebase-admin";
import { rsvpSchema } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { RSVP_LIMITS } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Data tidak sah" },
      { status: 400 }
    );
  }

  const { name, attend, count, msg, website } = parsed.data;

  // Honeypot: pretend success, store nothing
  if (website) {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(req);
  if (isRateLimited(`rsvp:${ip}`, RSVP_LIMITS.maxPerWindow, RSVP_LIMITS.windowMs)) {
    return NextResponse.json(
      { error: "Sila tunggu sebentar sebelum menghantar semula" },
      { status: 429 }
    );
  }

  try {
    const db = getDb();
    await db.collection(RSVPS_COLLECTION).add({
      name,
      attend,
      count,
      msg: msg || null,
      createdAt: new Date(),
      ip,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("RSVP write failed:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan RSVP. Sila cuba lagi." },
      { status: 500 }
    );
  }
}
