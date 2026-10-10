import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const runtime = "nodejs";

/**
 * Serves the wedding event as a real .ics URL (not a blob).
 * On iOS Safari this triggers the native "Add to Calendar" sheet —
 * blob downloads don't, so this endpoint is the mobile-friendly path.
 */
export async function GET() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AmaniFarhan//Wedding//EN",
    "BEGIN:VEVENT",
    "UID:af-wedding-20270703@invite",
    "DTSTAMP:20270101T000000Z",
    `DTSTART:${config.icsStart}`,
    `DTEND:${config.icsEnd}`,
    `SUMMARY:Walimatulurus ${config.bride} & ${config.groom}`,
    `DESCRIPTION:Majlis perkahwinan ${config.bride} & ${config.groom}. Aturcara 11:00 pagi - 4:00 petang.`,
    `LOCATION:${config.venueName}\\, ${config.venueAddress.replace(/,/g, "\\,")}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Pengingat: Walimatulurus esok ✦",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${config.icsFilename}"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
