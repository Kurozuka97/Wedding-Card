import { NextResponse } from "next/server";
import { getDb, RSVPS_COLLECTION } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token =
    req.headers.get("x-admin-token") ?? url.searchParams.get("token") ?? "";

  const expected = process.env.ADMIN_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = url.searchParams.get("format");

  try {
    const db = getDb();
    const snap = await db
      .collection(RSVPS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(1000)
      .get();

    const rsvps = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name as string,
        attend: data.attend as string,
        count: (data.count as number) ?? 1,
        msg: (data.msg as string) || "",
        createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : String(data.createdAt ?? ""),
      };
    });

    const summary = {
      total: rsvps.length,
      hadir: rsvps.filter((r) => r.attend === "hadir").length,
      pasti: rsvps.filter((r) => r.attend === "pasti").length,
      tidak: rsvps.filter((r) => r.attend === "tidak").length,
      totalGuests: rsvps
        .filter((r) => r.attend === "hadir")
        .reduce((sum, r) => sum + r.count, 0),
    };

    if (format === "csv") {
      const header = "Nama,Kehadiran,Bilangan,Ucapan,Tarikh";
      const rows = rsvps.map((r) =>
        [r.name, r.attend, r.count, `"${r.msg.replace(/"/g, '""')}"`, r.createdAt]
          .map((v) => String(v).replace(/,/g, " "))
          .join(",")
      );
      const csv = [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="rsvp-export.csv"',
        },
      });
    }

    return NextResponse.json({ rsvps, summary });
  } catch (err) {
    console.error("Admin fetch failed:", err);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}
