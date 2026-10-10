/**
 * ═══════════════════════════════════════════════════════════════
 *  WALIMATULURUS — WEDDING CONFIG
 *  Edit this file to change every detail of the invitation.
 * ═══════════════════════════════════════════════════════════════
 */

export const config = {
  /** Couple */
  bride: "Amani",
  groom: "Farhan",
  /** Displayed in <title>, OG tags, marquee */
  title: "Walimatulurus Amani & Farhan",

  /** Countdown target — must match your venue timezone (+08:00 = MYT) */
  eventDate: "2027-07-03T11:00:00+08:00",

  /** Cover + details */
  dayLabel: "Sabtu",
  dayNum: "03",
  monthLabel: "Julai",
  yearLabel: "2027",
  timeLabel: "11:00 Pagi — 4:00 Petang",
  arrivalNote: "Ketibaan pengantin · 12:30 tengah hari",
  location: "Kota Tinggi, Johor Darul Ta'zim",

  /** Venue */
  venueName: "Dewan Kota Kechil",
  venueAddress:
    "69, Jalan Kota Kecil, Bandar Kota Tinggi, 81900 Kota Tinggi, Johor",
  mapsUrl: "https://maps.app.goo.gl/HxAcaUAWFBD36qx87",

  /** Parents — bride side */
  brideFather: "Muhammad Khairi Bin Hasan",
  brideMother: "Noor Halifah Binti Abdul Ghani",
  /** Parents — groom side */
  groomFather: "Zainal Abidin Bin Md Jusoh",
  groomMother: "Mastura Binti Raja Ismail",

  /** Program (aturcara) */
  program: [
    { num: "01", time: "11:00 Pagi", title: "Ketibaan Tetamu", desc: "Sambutan mesra & jamuan ringan" },
    { num: "02", time: "12:30 T/Hari", title: "Ketibaan Pengantin", desc: "Perarakan diiringi paluan kompang & bunga manggar" },
    { num: "03", time: "1:15 Petang", title: "Doa Selamat & Jamuan", desc: "Bacaan doa & santapan beradab" },
    { num: "04", time: "2:45 Petang", title: "Sesi Fotografi", desc: "Rakam kenangan bersama pengantin di pelamin" },
    { num: "05", time: "4:00 Petang", title: "Persaraan Tetamu", desc: "Melabuh tirai, cenderahati buat yang hadir" },
  ],

  /** Gallery photos — drop real images into /public and update paths here */
  gallery: [
    { src: "/couple.svg", caption: "senja milik kita", extra: "" },
    { src: "/gallery-2.svg", caption: "genggaman janji", extra: "md:mt-14 md:-rotate-3" },
    { src: "/venue.webp", caption: "singgahsana cinta", extra: "md:rotate-2" },
    { src: "/gallery-4.svg", caption: "segala yang manis", extra: "md:mt-10 md:-rotate-6" },
  ],

  /** Contact numbers — tap-to-copy */
  contacts: [
    { label: "Ayah", display: "011-3247 8852", raw: "01132478852" },
    { label: "Ibu", display: "019-720 5223", raw: "0197205223" },
    { label: "Kakak", display: "013-391 3942", raw: "0133913942" },
  ],

  /** ICS calendar file times (UTC) — 11:00 MYT = 03:00 UTC */
  icsStart: "20270703T030000Z",
  icsEnd: "20270703T080000Z",
  icsFilename: "save-the-date-amani-farhan.ics",
} as const;

export type AppConfig = typeof config;
