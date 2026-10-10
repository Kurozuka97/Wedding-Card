# 💍 Walimatulurus Amani & Farhan

Digital wedding invitation — built with **Next.js**, **Tailwind CSS**, and **Google Firestore**.
Deployable on **Vercel** in minutes.

## ✨ Features

- 🎨 Full animated invitation (cover reveal, falling petals, ken-burns gallery, marquee, gold agate seams)
- ⏳ Live countdown to the wedding date
- 💌 RSVP form — submissions stored in **Google Firestore** (server-side, never exposed to browsers)
- 📜 Public wish wall — all guests see all wishes
- 📅 "Save the Date" — downloads an `.ics` calendar file
- 🗺 Google Maps directions link
- 📞 Tap-to-copy contact numbers
- 🎵 WebAudio generative background music (no audio file needed)
- 📊 **Admin dashboard** at `/admin` — view all RSVPs, filter by attendance, see headcount totals, export CSV
- 🔒 Rate limiting + honeypot spam protection
- 📱 Fully responsive with safe-area support (notch phones)

## 🚀 Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free tier is fine)
- A [Google Firebase](https://console.firebase.google.com) project (free Spark plan is fine)

### 2. Firebase Setup (Firestore + Service Account)

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**
2. In the project, go to **Build → Firestore Database** → **Create database**
   - Choose **Production mode**
   - Pick a location close to your guests (e.g. `asia-southeast1` for Malaysia)
3. Go to **Project Settings (⚙️) → Service Accounts → Generate new private key**
4. Download the JSON file — you'll need two values from it:
   - `project_id` → goes in `FIREBASE_PROJECT_ID`
   - `client_email` → goes in `FIREBASE_CLIENT_EMAIL`
   - `private_key` → goes in `FIREBASE_PRIVATE_KEY` (keep the `-----BEGIN...-----` headers, replace real newlines with `\n`)

> **Security note:** Firestore security rules should **deny all client access** since only your server (via the Admin SDK) reads/writes. In Firestore → Rules, set:
> ```
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /{document=**} {
>       allow read, write: if false;
>     }
>   }
> }
> ```

### 3. Local Development

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/amani-farhan-invite.git
cd amani-farhan-invite

# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.example .env.local
# Edit .env.local with your Firebase credentials + admin token

# Generate a strong admin token
openssl rand -hex 32

# Run dev server
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin?key=YOUR_ADMIN_TOKEN
```

### 4. Push to GitHub

```bash
git init
git add .
git commit -m "feat: wedding invitation with Firestore RSVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/amani-farhan-invite.git
git push -u origin main
```

### 5. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repository (`amani-farhan-invite`)
3. Vercel auto-detects **Next.js** — no build config needed
4. Under **Environment Variables**, add:
   | Name | Value |
   |------|-------|
   | `FIREBASE_PROJECT_ID` | from your Firebase JSON |
   | `FIREBASE_CLIENT_EMAIL` | from your Firebase JSON |
   | `FIREBASE_PRIVATE_KEY` | from your Firebase JSON (with `\n` for newlines) |
   | `ADMIN_TOKEN` | your long random string |
5. Click **Deploy** 🎉

Your site is live at `https://amani-farhan-invite.vercel.app`

> **Tip:** Add a custom domain in Vercel → Settings → Domains.

## 📝 Customizing the Wedding

All wedding details live in **one file**: [`lib/config.ts`](lib/config.ts)

```ts
export const config = {
  bride: "Amani",
  groom: "Farhan",
  eventDate: "2027-07-03T11:00:00+08:00", // countdown target
  venueName: "Dewan Kota Kechil",
  venueAddress: "69, Jalan Kota Kecil, ...",
  mapsUrl: "https://maps.app.goo.gl/...",
  // ... parents, program, contacts, gallery, ICS times
};
```

Edit that file → push to `main` → Vercel auto-redeploys.

### Replacing Placeholder Images

The site ships with themed SVG placeholders. To use real photos:

1. Drop your images into `public/` (e.g. `public/couple.jpg`, `public/venue.jpg`)
2. Update the paths in `lib/config.ts`:
   ```ts
   gallery: [
     { src: "/couple.jpg", caption: "senja milik kita", extra: "" },
     // ...
   ],
   ```
3. For the main couple photo & venue photo, update the `src` in `components/Invitation.tsx` (search for `/couple.svg` and `/venue.svg`)

## 📂 Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Invitation page
│   ├── globals.css             # All custom styles & animations
│   ├── admin/page.tsx          # RSVP admin dashboard
│   └── api/
│       ├── rsvp/route.ts       # POST — submit RSVP → Firestore
│       ├── wishes/route.ts     # GET  — public wish wall
│       └── admin/rsvps/route.ts# GET  — all RSVPs + CSV export (token-protected)
├── components/
│   └── Invitation.tsx          # Main invitation (client component)
├── lib/
│   ├── config.ts               # ⬅ EDIT THIS to customize the wedding
│   ├── firebase-admin.ts       # Firestore Admin SDK init
│   ├── validation.ts           # Zod schemas + rate limit config
│   └── rate-limit.ts           # In-memory sliding-window limiter
└── public/                     # Static assets (images)
```

## 🔐 Admin Dashboard

- URL: `https://your-site.vercel.app/admin?key=YOUR_ADMIN_TOKEN`
- View all RSVPs with name, attendance, headcount, and message
- Filter by Hadir / Belum Pasti / Tidak Hadir
- See summary stats (total RSVPs, confirmed guests)
- Export everything as CSV
- Token is stored in `sessionStorage` (stays in that browser tab only)

## 🛡️ Security

- **Firestore is never exposed to the client** — all reads/writes go through serverless API routes
- **Firebase credentials** live only in Vercel environment variables
- **Admin routes** require `ADMIN_TOKEN` match
- **Rate limiting**: max 4 RSVP submissions per IP per minute
- **Honeypot field** silently rejects bot submissions
- **Input validation** via Zod (length caps, enum checks)

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Database | Google Firestore (via firebase-admin) |
| Validation | Zod |
| Fonts | next/font (self-hosted, no CDN) |
| Hosting | Vercel |
| Version control | GitHub |

## 📄 License

Private — personal wedding project.
