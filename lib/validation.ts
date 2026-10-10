import { z } from "zod";

export const rsvpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama terlalu pendek")
    .max(40, "Nama terlalu panjang"),
  attend: z.enum(["hadir", "pasti", "tidak"], {
    errorMap: () => ({ message: "Sila pilih kehadiran" }),
  }),
  count: z.coerce
    .number()
    .int()
    .min(1)
    .max(5),
  msg: z
    .string()
    .trim()
    .max(220, "Ucapan terlalu panjang")
    .optional()
    .default(""),
  /** Honeypot — real users never fill this */
  website: z.string().max(0).optional().default(""),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

export const RSVP_LIMITS = {
  maxPerDay: 200,
  windowMs: 60_000, // 1 request / minute / IP
  maxPerWindow: 4,
} as const;
