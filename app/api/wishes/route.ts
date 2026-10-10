import { NextResponse } from "next/server";
import { getDb, RSVPS_COLLECTION } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getDb();
    const snap = await db
      .collection(RSVPS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const wishes = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name as string,
        attend: data.attend as string,
        count: (data.count as number) ?? 1,
        msg: (data.msg as string) || "",
        time: formatDate(data.createdAt),
      };
    });

    return NextResponse.json({ wishes });
  } catch (err) {
    console.error("Wishes fetch failed:", err);
    return NextResponse.json({ wishes: [] }, { status: 200 });
  }
}

function formatDate(ts: unknown): string {
  try {
    let date: Date;
    if (ts instanceof Date) {
      date = ts;
    } else if (
      ts &&
      typeof ts === "object" &&
      "toDate" in ts &&
      typeof (ts as { toDate: () => Date }).toDate === "function"
    ) {
      date = (ts as { toDate: () => Date }).toDate();
    } else {
      date = new Date(ts as string | number);
    }
    return date.toLocaleDateString("ms-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
