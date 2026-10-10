"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { config } from "@/lib/config";

/* ── YouTube IFrame API (background music) ── */
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, options: Record<string, unknown>) => YTPlayer;
}

const YT_VIDEO_ID = "wM66-6ISA-k";
const YT_TRACK_LABEL = "Faouzia — Unethical";
let ytApiPromise: Promise<YTNamespace> | null = null;

function loadYTApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("yt-timeout")), 10000);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      clearTimeout(timer);
      if (window.YT) resolve(window.YT);
      else reject(new Error("yt-missing"));
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      clearTimeout(timer);
      reject(new Error("yt-load-failed"));
    };
    document.head.appendChild(s);
  });
  return ytApiPromise;
}

/* ── types ── */
interface Wish {
  id: string;
  name: string;
  attend: string;
  count: number;
  msg: string;
  time: string;
}

/* ── gold seam path ── */
const SEAM_PATH =
  "M12 0 L16 20 L9 40 L17 60 L10 80 L16 100 L9 120 L17 140 L10 160 L16 180 L9 200 L17 220 L10 240 L16 260 L9 280 L17 300 L10 320 L16 340 L9 360 L14 380 L12 400";

function Seam({ style }: { style: React.CSSProperties }) {
  return (
    <div className="seam" data-seam style={style}>
      <svg viewBox="0 0 24 400" preserveAspectRatio="none" fill="none">
        <path d={SEAM_PATH} stroke="#7a4c14" strokeWidth="7" opacity="0.55" />
        <path d={SEAM_PATH} stroke="#d3a94f" strokeWidth="3" />
        <path
          d={SEAM_PATH}
          stroke="#f6e7c1"
          strokeWidth="1"
          strokeDasharray="4 6"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

/* ── attendance badge styles ── */
const ALBL: Record<string, string> = {
  hadir: "Hadir",
  pasti: "Belum Pasti",
  tidak: "Tidak Hadir",
};

const ASTY: Record<string, React.CSSProperties> = {
  hadir: { background: "rgba(211,169,79,.16)", color: "#e9cf9a", border: "1px solid rgba(211,169,79,.5)" },
  pasti: { background: "rgba(30,122,94,.18)", color: "#9fd8c2", border: "1px solid rgba(30,122,94,.5)" },
  tidak: { background: "rgba(243,233,220,.08)", color: "rgba(243,233,220,.6)", border: "1px solid rgba(243,233,220,.2)" },
};

/* ────────────────────────────────────────────── */

export function Invitation() {
  /* state */
  const [coverOpen, setCoverOpen] = useState(false);
  const [barShow, setBarShow] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [toast, setToast] = useState("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [rsvName, setRsvName] = useState("");
  const [rsvAttend, setRsvAttend] = useState("");
  const [rsvCount, setRsvCount] = useState("1");
  const [rsvMsg, setRsvMsg] = useState("");
  const [rsvHoney, setRsvHoney] = useState("");
  const [rsvBusy, setRsvBusy] = useState(false);
  const [cdD, setCdD] = useState("00");
  const [cdH, setCdH] = useState("00");
  const [cdM, setCdM] = useState("00");
  const [cdS, setCdS] = useState("00");
  const [musicStarted, setMusicStarted] = useState(false);
  const [miniCollapsed, setMiniCollapsed] = useState(false);

  /* refs */
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mGainRef = useRef<GainNode | null>(null);
  const dSendRef = useRef<GainNode | null>(null);
  const mTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mStepRef = useRef(0);
  const mOnRef = useRef(false);
  const cdDRef = useRef<string>("00");
  const cdHRef = useRef<string>("00");
  const cdMRef = useRef<string>("00");
  const cdSRef = useRef<string>("00");
  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytReadyRef = useRef(false);
  const ytWantedRef = useRef(false);
  const ytFailedRef = useRef(false);

  /* ── helpers ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  /* ── cover open ── */
  const openCover = useCallback(() => {
    setCoverOpen(true);
    setBarShow(true);
    document.body.classList.remove("locked");
    // trigger split-text animations
    document.querySelectorAll("[data-split]").forEach((el, i) => {
      setTimeout(() => el.classList.add("played"), 450 + i * 200);
    });
    startMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── music (WebAudio) ── */
  const CHORDS = [
    [174.61, 261.63, 349.23, 440],
    [261.63, 329.63, 392, 523.25],
    [220, 261.63, 329.63, 440],
    [196, 293.66, 392, 493.88],
  ];
  const BASS = [87.31, 130.81, 110, 98];
  const ARP = [0, 1, 2, 3, 2, 1, 2, 3];

  function note(
    fr: number,
    t: number,
    dur: number,
    g: number,
    type?: OscillatorType
  ) {
    const ctx = audioCtxRef.current;
    const gain = mGainRef.current;
    if (!ctx || !gain) return;
    const o = ctx.createOscillator();
    const v = ctx.createGain();
    o.type = type || "triangle";
    o.frequency.value = fr;
    v.gain.setValueAtTime(0, t);
    v.gain.linearRampToValueAtTime(g, t + 0.06);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v);
    v.connect(gain);
    const ds = dSendRef.current;
    if (ds) v.connect(ds);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  function initAudio() {
    if (audioCtxRef.current) return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    audioCtxRef.current = ctx;
    const mGain = ctx.createGain();
    mGain.gain.value = 0;
    mGain.connect(ctx.destination);
    mGainRef.current = mGain;
    const dl = ctx.createDelay(1);
    dl.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    dl.connect(fb);
    fb.connect(dl);
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    dl.connect(wet);
    wet.connect(mGain);
    const dSend = ctx.createGain();
    dSend.gain.value = 0.4;
    dSend.connect(dl);
    dSendRef.current = dSend;
  }

  function mTick() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime + 0.08;
    const ch = CHORDS[Math.floor(mStepRef.current / 8) % 4]!;
    note(ch[ARP[mStepRef.current % 8]!]!, t, 1.7, 0.2);
    if (mStepRef.current % 8 === 0)
      note(BASS[Math.floor(mStepRef.current / 8) % 4]!, t, 3.6, 0.15, "sine");
    if (mStepRef.current % 16 === 12) note(ch[3]! * 2, t, 2.4, 0.09);
    mStepRef.current++;
  }

  function startSynth() {
    initAudio();
    const ctx = audioCtxRef.current;
    const gain = mGainRef.current;
    if (!ctx || !gain) return;
    ctx.resume();
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.5);
    if (!mTimerRef.current)
      mTimerRef.current = setInterval(mTick, 420);
    mOnRef.current = true;
    setMusicOn(true);
  }

  function stopSynth() {
    const ctx = audioCtxRef.current;
    const gain = mGainRef.current;
    if (ctx && gain) {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    }
    setTimeout(() => {
      if (!mOnRef.current && mTimerRef.current) {
        clearInterval(mTimerRef.current);
        mTimerRef.current = null;
      }
    }, 650);
  }

  /* YouTube-first music; WebAudio synth is the fallback */
  function startMusic() {
    mOnRef.current = true;
    setMusicOn(true);
    setMusicStarted(true);
    if (ytFailedRef.current) {
      startSynth();
      return;
    }
    if (ytReadyRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.playVideo();
    }
    /* else: the [musicStarted] effect loads the API & player, onReady plays */
  }

  function stopMusic() {
    mOnRef.current = false;
    setMusicOn(false);
    if (ytReadyRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.pauseVideo();
    } else {
      stopSynth();
    }
  }

  /* create the YouTube player once the mini-player host is mounted */
  useEffect(() => {
    if (!musicStarted || ytFailedRef.current || ytPlayerRef.current) return;
    let cancelled = false;
    loadYTApi()
      .then((YT) => {
        if (cancelled || !ytHostRef.current || ytPlayerRef.current) return;
        /* inner div is replaced by the iframe; keeps React's ref node intact */
        const mount = document.createElement("div");
        ytHostRef.current.appendChild(mount);
        ytPlayerRef.current = new YT.Player(mount, {
          videoId: YT_VIDEO_ID,
          width: "120",
          height: "68",
          playerVars: {
            autoplay: 0,
            controls: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            loop: 1,
            playlist: YT_VIDEO_ID,
          },
          events: {
            onReady: (e: { target: YTPlayer }) => {
              ytReadyRef.current = true;
              if (mOnRef.current) e.target.playVideo();
            },
            onStateChange: (e: { data: number }) => {
              /* ended → replay (loop safety net) */
              if (e.data === 0 && mOnRef.current && ytPlayerRef.current) {
                ytPlayerRef.current.playVideo();
              }
            },
            onError: () => {
              /* blocked/deleted → fall back to the synth */
              ytFailedRef.current = true;
              ytReadyRef.current = false;
              if (mOnRef.current) startSynth();
            },
          },
        });
      })
      .catch(() => {
        ytFailedRef.current = true;
        if (mOnRef.current) startSynth();
      });
    return () => {
      cancelled = true;
    };
  }, [musicStarted]);

  /* ── countdown ── */
  useEffect(() => {
    const target = new Date(config.eventDate).getTime();
    function tick() {
      let d = target - Date.now();
      if (d < 0) d = 0;
      const vals = {
        d: String(Math.floor(d / 86400000)).padStart(2, "0"),
        h: String(Math.floor(d / 3600000) % 24).padStart(2, "0"),
        m: String(Math.floor(d / 60000) % 60).padStart(2, "0"),
        s: String(Math.floor(d / 1000) % 60).padStart(2, "0"),
      };
      if (cdDRef.current !== vals.d) { setCdD(vals.d); cdDRef.current = vals.d; }
      if (cdHRef.current !== vals.h) { setCdH(vals.h); cdHRef.current = vals.h; }
      if (cdMRef.current !== vals.m) { setCdM(vals.m); cdMRef.current = vals.m; }
      if (cdSRef.current !== vals.s) { setCdS(vals.s); cdSRef.current = vals.s; }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── scroll reveal ── */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("revealed");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    /* progress bar */
    let busy = false;
    const onScroll = () => {
      if (busy) return;
      busy = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY || document.documentElement.scrollTop;
        const dh =
          document.documentElement.scrollHeight - window.innerHeight;
        const bar = document.getElementById("progressBar");
        if (bar)
          bar.style.width = (dh > 0 ? (sy / dh) * 100 : 0) + "%";
        busy = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* petals */
    const boxEl = document.getElementById("petalBox");
    if (boxEl) {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const count = isMobile ? 9 : 16;
      const pals = [
        "linear-gradient(135deg,rgba(233,207,154,.55),rgba(185,134,47,.35))",
        "linear-gradient(135deg,rgba(30,122,94,.5),rgba(15,61,46,.4))",
        "linear-gradient(135deg,rgba(107,24,48,.5),rgba(50,8,24,.4))",
      ];
      for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "petal";
        p.style.left = Math.random() * 100 + "vw";
        const sz = Math.random() * 7 + 5;
        p.style.width = sz + "px";
        p.style.height = sz * 1.5 + "px";
        p.style.background = pals[i % 3]!;
        p.style.animationDuration = Math.random() * 5 + 9 + "s";
        p.style.animationDelay = Math.random() * 9 + "s";
        boxEl.appendChild(p);
      }
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (boxEl) boxEl.innerHTML = "";
    };
  }, []);

  /* ── split text ── */
  useEffect(() => {
    document.querySelectorAll("[data-split]").forEach((el) => {
      const txt = el.textContent || "";
      el.textContent = "";
      let ci = 0;
      Array.from(txt).forEach((c) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.style.setProperty("--i", String(ci));
        s.textContent = c === " " ? "\u00A0" : c;
        el.appendChild(s);
        ci++;
      });
    });
  }, []);

  /* ── wishes load ── */
  useEffect(() => {
    fetch("/api/wishes")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.wishes)) setWishes(d.wishes);
      })
      .catch(() => {});
  }, []);

  /* ── RSVP submit ── */
  async function submitRsvp(ev: React.FormEvent) {
    ev.preventDefault();
    if (!rsvName.trim() || !rsvAttend) {
      showToast("Sila isi nama & kehadiran");
      return;
    }
    setRsvBusy(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rsvName.trim(),
          attend: rsvAttend,
          count: rsvCount,
          msg: rsvMsg.trim(),
          website: rsvHoney,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast("Terima kasih atas RSVP anda ✦");
        setRsvName("");
        setRsvAttend("");
        setRsvCount("1");
        setRsvMsg("");
        // refresh wishes
        fetch("/api/wishes")
          .then((r) => r.json())
          .then((d) => {
            if (Array.isArray(d.wishes)) setWishes(d.wishes);
          })
          .catch(() => {});
      } else {
        showToast(data.error || "Gagal menghantar RSVP");
      }
    } catch {
      showToast("Ralat rangkaian. Sila cuba lagi.");
    }
    setRsvBusy(false);
  }

  /* ── copy number ── */
  async function copyNumber(num: string, pillEl: HTMLElement | null) {
    if (!pillEl) return;
    const done = () => {
      const t = pillEl.querySelector(".cp-toast");
      if (t) {
        t.classList.add("show");
        setTimeout(() => t.classList.remove("show"), 1400);
      }
    };
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(num);
        done();
      } else {
        legacyCopy(num);
        done();
      }
    } catch {
      legacyCopy(num);
      done();
    }
  }

  function legacyCopy(txt: string) {
    const t = document.createElement("input");
    t.value = txt;
    document.body.appendChild(t);
    t.select();
    try {
      document.execCommand("copy");
    } catch {
      /* noop */
    }
    t.remove();
  }

  /* ── ICS download ── */
  function downloadICS() {
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
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([lines], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = config.icsFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Tarikh disimpan 📅");
  }

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  /* ── cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (mTimerRef.current) clearInterval(mTimerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  /* ─────────── render ─────────── */
  return (
    <>
      {/* overlays */}
      <div id="progressBar" />
      <div className="grain" />
      <div id="petalBox" />
      <div id="toast" className={toast ? "show" : ""}>
        {toast}
      </div>

      {/* ═══ COVER ═══ */}
      <div id="cover" className={coverOpen ? "opened" : ""}>
        <div className="marble absolute inset-y-0 left-0 w-[26%] md:w-[34%]" />
        <Seam style={{ left: "26%" }} />
        <div className="seam hidden md:block" style={{ left: "34%" }}>
          <svg viewBox="0 0 24 400" preserveAspectRatio="none" fill="none">
            <path d={SEAM_PATH} stroke="#7a4c14" strokeWidth="7" opacity="0.55" />
            <path d={SEAM_PATH} stroke="#d3a94f" strokeWidth="3" />
            <path d={SEAM_PATH} stroke="#f6e7c1" strokeWidth="1" strokeDasharray="4 6" opacity="0.9" />
          </svg>
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(800px 500px at 80% 10%,rgba(211,169,79,.1),transparent 55%),linear-gradient(200deg,rgba(34,4,14,0) 40%,rgba(34,4,14,.7) 100%)",
          }}
        />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center pl-[30%] md:pl-[38%] pr-5 max-w-2xl w-full py-14">
            <p className="cover-pop mlabel text-gold-light" style={{ animationDelay: ".1s" }}>
              ✦ Walimatulurus ✦
            </p>
            <h1
              className="cover-pop script-h text-[clamp(2.8rem,11vw,5.5rem)] mt-4"
              style={{ animationDelay: ".28s" }}
            >
              {config.bride} <span className="text-gold">&</span> {config.groom}
            </h1>
            <div className="cover-pop flex items-center justify-center gap-4 mt-8" style={{ animationDelay: ".46s" }}>
              <p className="mlabel text-cream/80">{config.dayLabel}</p>
              <div className="border-x border-gold/60 px-6 py-1">
                <p className="font-display font-light text-6xl text-gold-light leading-none">
                  {config.dayNum}
                </p>
              </div>
              <div className="text-left mlabel text-cream/80 !leading-[1.7]">
                {config.monthLabel}
                <br />
                {config.yearLabel}
              </div>
            </div>
            <p className="cover-pop mlabel text-cream/60 mt-6" style={{ animationDelay: ".6s" }}>
              {config.timeLabel}
            </p>
            <button
              onClick={openCover}
              className="cover-pop mt-9 w-full sm:w-auto inline-flex justify-center items-center gap-3 border border-gold-light/70 text-gold-light px-10 py-4 rounded-full mlabel active:bg-gold-light active:text-maroon-dark transition-all duration-300"
              style={{ animationDelay: ".74s" }}
            >
              ✉ &nbsp;Buka Undangan
            </button>
            <p className="cover-pop font-body italic text-cream/50 text-sm mt-5" style={{ animationDelay: ".88s" }}>
              {config.location}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="safe-top fixed top-0 left-0 right-0 z-[60] mix-blend-difference text-white px-5 md:px-10 pb-4 flex items-center justify-between pointer-events-none">
        <span className="font-script text-2xl leading-none">
          {config.bride.charAt(0)}&amp;{config.groom.charAt(0)}
        </span>
        <span className="mlabel !text-[10px]">
          {config.dayNum} · 07 · {config.yearLabel}
        </span>
      </nav>

      <main className="pb-24">
        {/* ═══ SALAM & FAMILY ═══ */}
        <section className="px-5 pt-24 md:pt-32 pb-20 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto">
            <p className="font-arab text-2xl md:text-3xl text-gold-light mb-6" data-reveal>
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>
            <p className="script-h text-4xl md:text-5xl mb-3" data-reveal>
              Assalamualaikum
            </p>
            <p className="mlabel text-gold mb-8" data-reveal>W.B.T</p>
            <p className="font-body italic text-lg text-cream/70 mb-8" data-reveal>
              Dengan penuh kesyukuran, kami
            </p>
            <div data-reveal>
              <p className="font-display font-semibold text-lg md:text-xl leading-snug text-cream">
                {config.brideFather}
              </p>
              <p className="mlabel !text-[9px] text-gold/70 mt-1">
                Ayahanda Pengantin Perempuan
              </p>
              <p className="script-h text-2xl my-2">&amp;</p>
              <p className="font-display font-semibold text-lg md:text-xl leading-snug text-cream">
                {config.brideMother}
              </p>
              <p className="mlabel !text-[9px] text-gold/70 mt-1">
                Bonda Pengantin Perempuan
              </p>
            </div>
            <p className="font-body italic text-lg text-cream/60 my-7" data-reveal>
              bersama
            </p>
            <div data-reveal>
              <p className="font-display font-semibold text-lg md:text-xl leading-snug text-cream">
                {config.groomFather}
              </p>
              <p className="mlabel !text-[9px] text-gold/70 mt-1">
                Ayahanda Pengantin Lelaki
              </p>
              <p className="script-h text-2xl my-2">&amp;</p>
              <p className="font-display font-semibold text-lg md:text-xl leading-snug text-cream">
                {config.groomMother}
              </p>
              <p className="mlabel !text-[9px] text-gold/70 mt-1">
                Bonda Pengantin Lelaki
              </p>
            </div>
            <p className="font-body italic text-base md:text-lg text-cream/70 leading-relaxed mt-9 max-w-xl mx-auto" data-reveal>
              menjemput yang berbahagia{" "}
              <span className="not-italic font-display text-sm md:text-base text-gold-light">
                Tan Sri / Puan Sri / Dato&apos; Seri / Datin Seri / Dato&apos; / Datin / Tuan / Puan / Encik / Cik
              </span>{" "}
              ke majlis perkahwinan anakanda kami
            </p>
            <div className="mt-10">
              <div className="maskline">
                <h1
                  data-split
                  className="font-display font-light leading-[0.95] text-[clamp(3rem,15vw,7.5rem)] text-cream"
                >
                  {config.bride}
                </h1>
              </div>
              <p className="script-h text-[clamp(2.2rem,8vw,4rem)] leading-none -my-1" data-reveal>
                &amp;
              </p>
              <div className="maskline">
                <h1
                  data-split
                  className="font-display font-light italic leading-[0.95] text-[clamp(3rem,15vw,7.5rem)] text-gold-light"
                >
                  {config.groom}
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* marble divider */}
        <div className="relative h-12 md:h-16 overflow-hidden border-y border-gold/40">
          <div className="marble absolute inset-0" />
        </div>

        {/* ═══ MARQUEE ═══ */}
        <div className="bg-maroon-dark border-b border-gold/30 py-3 overflow-hidden">
          <div className="marquee-track">
            {[0, 1].map((dup) => (
              <div
                key={dup}
                className="flex items-center gap-6 pr-6 mlabel !text-[10px] md:!text-[11px] text-cream whitespace-nowrap"
              >
                {[0, 1].map((seg) => (
                  <span key={seg} className="contents">
                    <span>{config.bride} ♥ {config.groom}</span>
                    <span className="text-gold-light">✦</span>
                    <span>{config.dayLabel} · {config.dayNum} {config.monthLabel} {config.yearLabel}</span>
                    <span className="text-gold-light">✦</span>
                    <span>Walimatulurus</span>
                    <span className="text-gold-light">✦</span>
                    <span>{config.venueName}</span>
                    <span className="text-gold-light">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ PASANGAN ═══ */}
        <section className="py-20 md:py-28 px-5">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div data-reveal="scale">
              <figure className="frame-gold w-[min(78vw,330px)] md:w-full mx-auto aspect-[3/4] overflow-hidden bg-maroon">
                <img
                  className="kenburns"
                  src="/couple.svg"
                  alt="Pasangan pengantin"
                />
              </figure>
            </div>
            <div className="text-center md:text-left" data-reveal>
              <p className="script-h text-4xl md:text-5xl mb-3">Pasangan Pengantin</p>
              <h2 className="font-display font-light text-2xl md:text-3xl leading-tight text-cream">
                {config.bride} <span className="script-h text-3xl">&amp;</span> {config.groom}
              </h2>
              <p className="font-body italic text-cream/70 text-base md:text-lg leading-relaxed mt-4">
                Dua hati yang dipertemukan, dua keluarga yang disatukan. Dengan lafaz yang suci, kami memulakan perjalanan sehidup semati — dan kami ingin anda menjadi saksi cinta ini.
              </p>
              <div className="flex md:hidden justify-center mt-6">
                <span className="h-px w-20 bg-gold" />
              </div>
              <p className="script-h text-3xl mt-6">terima kasih, kerana sudi hadir ✦</p>
            </div>
          </div>
        </section>

        {/* ═══ COUNTDOWN ═══ */}
        <section className="bg-maroon-dark py-20 md:py-28 px-5 relative overflow-hidden">
          <div className="marble absolute inset-y-0 right-0 w-[14%] md:w-[22%] opacity-90" />
          <Seam style={{ left: "86%" }} />
          <div className="seam hidden md:block" style={{ left: "78%" }}>
            <svg viewBox="0 0 24 400" preserveAspectRatio="none" fill="none">
              <path d={SEAM_PATH} stroke="#7a4c14" strokeWidth="7" opacity="0.55" />
              <path d={SEAM_PATH} stroke="#d3a94f" strokeWidth="3" />
              <path d={SEAM_PATH} stroke="#f6e7c1" strokeWidth="1" strokeDasharray="4 6" opacity="0.9" />
            </svg>
          </div>
          <div className="relative max-w-3xl mx-auto text-center pr-[3.5rem] md:pr-24 pl-2">
            <p className="script-h text-4xl md:text-5xl mb-2" data-reveal>Save the Date</p>
            <p className="mlabel text-gold mb-10" data-reveal>
              {config.dayLabel} · {config.dayNum} {config.monthLabel} {config.yearLabel}
            </p>
            <div className="grid grid-cols-4 gap-2 md:gap-6" data-reveal>
              {[
                { val: cdD, label: "Hari" },
                { val: cdH, label: "Jam" },
                { val: cdM, label: "Minit" },
                { val: cdS, label: "Saat" },
              ].map((item, i) => (
                <div key={item.label}>
                  <div
                    id={i === 0 ? "cdD" : i === 1 ? "cdH" : i === 2 ? "cdM" : "cdS"}
                    className={`cd-val text-[clamp(1.5rem,9vw,3.5rem)] md:text-[clamp(2rem,6vw,5rem)] ${i === 3 ? "text-gold-light" : "text-cream"}`}
                  >
                    {item.val}
                  </div>
                  <p className="mlabel !text-[8px] md:!text-[10px] !tracking-[.25em] text-gold-light/80 mt-2">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="script-h text-3xl md:text-4xl mt-11" data-reveal>
              sehingga kita bertemu ✦
            </p>
          </div>
        </section>

        {/* ═══ DETAILS ═══ */}
        <section className="py-20 md:py-28 px-5">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12" data-reveal>
              <p className="script-h text-4xl md:text-5xl">Details</p>
              <p className="mlabel text-gold mt-2">Tempat &amp; Masa</p>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-maroon shadow-2xl border border-gold/30 mb-8" data-reveal>
              <div className="marble absolute inset-y-0 left-0 w-[26%] md:w-[30%]" />
              <Seam style={{ left: "26%" }} />
              <div className="seam hidden md:block" style={{ left: "30%" }}>
                <svg viewBox="0 0 24 400" preserveAspectRatio="none" fill="none">
                  <path d={SEAM_PATH} stroke="#7a4c14" strokeWidth="7" opacity="0.55" />
                  <path d={SEAM_PATH} stroke="#d3a94f" strokeWidth="3" />
                  <path d={SEAM_PATH} stroke="#f6e7c1" strokeWidth="1" strokeDasharray="4 6" opacity="0.9" />
                </svg>
              </div>
              <div className="relative pl-[34%] md:pl-[38%] pr-5 md:pr-10 py-9">
                <p className="mlabel text-gold mb-4">Tarikh &amp; Masa</p>
                <p className="font-display font-light text-3xl md:text-4xl text-cream leading-none">
                  {config.dayLabel}
                </p>
                <p className="font-display font-light text-5xl md:text-6xl text-gold-light leading-none mt-1">
                  {config.dayNum}{" "}
                  <span className="text-2xl md:text-3xl text-cream">
                    {config.monthLabel} {config.yearLabel}
                  </span>
                </p>
                <div className="h-px bg-gold/40 my-5" />
                <p className="font-body text-lg text-cream/85">{config.timeLabel}</p>
                <p className="font-body italic text-cream/60 mt-1">{config.arrivalNote}</p>
              </div>
            </div>

            <div className="frame-gold overflow-hidden rounded-xl" data-reveal>
              <figure className="w-full aspect-[4/4.4] md:aspect-[16/8]">
                <img className="kenburns" src="/venue.webp" alt={config.venueName} />
              </figure>
              <div className="relative bg-maroon-dark/90 px-5 py-6 md:py-7 text-center border-t border-gold/30">
                <p className="mlabel !text-[9px] text-gold-light mb-2">Tempat</p>
                <p className="font-display text-xl md:text-3xl font-light text-cream">
                  {config.venueName}
                </p>
                <p className="font-body italic text-cream/75 mt-1 text-sm md:text-base">
                  {config.venueAddress}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8" data-reveal>
              <a
                href={config.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-fill w-full sm:w-auto"
              >
                🗺 &nbsp;Dapatkan Arah
              </a>
              <button onClick={downloadICS} className="btn-line w-full sm:w-auto">
                📅 &nbsp;Simpan Tarikh
              </button>
            </div>
          </div>
        </section>

        {/* marble divider */}
        <div className="relative h-12 md:h-16 overflow-hidden border-y border-gold/40">
          <div className="marble absolute inset-0" />
        </div>

        {/* ═══ ATURCARA ═══ */}
        <section className="py-20 md:py-28 px-5">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12" data-reveal>
              <p className="script-h text-4xl md:text-5xl">Aturcara Majlis</p>
              <p className="mlabel text-gold mt-2">Sehari · Seribu Kenangan</p>
            </div>
            {config.program.map((item, idx) => (
              <div
                key={item.num}
                className={`row-hair grid grid-cols-[44px_1fr] md:grid-cols-[110px_150px_1fr] items-start md:items-baseline gap-x-4 gap-y-1 py-5 px-1 md:px-3 ${
                  idx === config.program.length - 1 ? "border-b border-cream/10" : ""
                }`}
                data-reveal
              >
                <span className="font-display italic text-2xl md:text-4xl text-gold/80 leading-none pt-1">
                  {item.num}
                </span>
                <span className="hidden md:block mlabel !tracking-[.2em] text-gold-light">
                  {item.time}
                </span>
                <div>
                  <p className="mlabel !text-[9px] !tracking-[.25em] text-gold-light md:hidden mb-1">
                    {item.time}
                  </p>
                  <p className="font-display text-lg md:text-xl font-semibold leading-snug text-cream">
                    {item.title}
                  </p>
                  <p className="font-body italic text-cream/60 text-sm md:text-base">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ GALERI ═══ */}
        <section className="py-20 md:py-28 bg-maroon-dark overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 px-5" data-reveal>
              <p className="script-h text-4xl md:text-5xl">Galeri</p>
              <p className="mlabel text-gold mt-2">Nota Kenangan</p>
            </div>
            <div className="relative">
              <div className="md:hidden absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-maroon-dark to-transparent z-10 pointer-events-none" />
              <div className="md:hidden absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-maroon-dark to-transparent z-10 pointer-events-none" />
              <div className="flex md:flex-wrap md:justify-center gap-5 md:gap-10 overflow-x-auto md:overflow-visible no-scrollbar snap-x snap-mandatory md:snap-none px-6 md:px-8 pb-6 pt-4">
                {config.gallery.map((photo, i) => (
                  <figure
                    key={i}
                    className={`g-card shrink-0 snap-center w-[74vw] max-w-[300px] md:w-[260px] ${photo.extra || ""}`}
                    data-reveal
                  >
                    <div className="tape" />
                    <img
                      src={photo.src}
                      alt={photo.caption}
                      className="w-full h-80 object-cover"
                      loading="lazy"
                    />
                    <figcaption className="script-h text-2xl text-center mt-3 pb-1">
                      {photo.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <p className="md:hidden text-center mlabel !text-[9px] text-cream/35 mt-1">
              ← leret untuk lihat lagi →
            </p>
          </div>
        </section>

        {/* ═══ DOA ═══ */}
        <section className="py-20 md:py-28 px-5 text-center">
          <div className="max-w-xl mx-auto">
            <p className="script-h text-4xl md:text-5xl mb-8" data-reveal>Doa Restu</p>
            <p className="font-arab text-2xl md:text-3xl text-gold-light mb-6" data-reveal>
              وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً
            </p>
            <p className="font-body italic text-base md:text-lg text-cream/60 leading-relaxed" data-reveal>
              &quot;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya.&quot;
            </p>
            <p className="mlabel text-gold mt-5 mb-10" data-reveal>— Surah Ar-Rum : 21</p>
            <div className="flex items-center gap-4 mb-8" data-reveal>
              <span className="h-px flex-1 bg-gold/30" />
              <span className="text-gold">✦</span>
              <span className="h-px flex-1 bg-gold/30" />
            </div>
            <p className="font-display font-light italic text-xl md:text-2xl leading-relaxed text-cream" data-reveal>
              Semoga kehadiran para jemputan akan menyerikan lagi majlis ini dan seterusnya diberkati Allah S.W.T.
            </p>
          </div>
        </section>

        {/* ═══ RSVP ═══ */}
        <section
          id="rsvp"
          className="bg-maroon-dark py-20 md:py-28 px-5 relative overflow-hidden border-t border-gold/30"
        >
          <div className="marble absolute inset-y-0 left-0 w-[12%] md:w-[18%] opacity-90" />
          <Seam style={{ left: "12%" }} />
          <div className="seam hidden md:block" style={{ left: "18%" }}>
            <svg viewBox="0 0 24 400" preserveAspectRatio="none" fill="none">
              <path d={SEAM_PATH} stroke="#7a4c14" strokeWidth="7" opacity="0.55" />
              <path d={SEAM_PATH} stroke="#d3a94f" strokeWidth="3" />
              <path d={SEAM_PATH} stroke="#f6e7c1" strokeWidth="1" strokeDasharray="4 6" opacity="0.9" />
            </svg>
          </div>
          <div className="relative max-w-xl mx-auto md:ml-auto md:mr-8">
            <div className="text-center mb-10" data-reveal>
              <p className="script-h text-4xl md:text-5xl">Kindly Reply</p>
              <p className="mlabel text-gold mt-2 mb-4">RSVP &amp; Ucapan</p>
              <p className="font-body italic text-cream/60 text-base md:text-lg">
                Kehadiran anda, hadiah terindah buat kami.
              </p>
            </div>
            <form onSubmit={submitRsvp} className="space-y-3.5" data-reveal>
              {/* honeypot */}
              <input
                type="text"
                name="website"
                value={rsvHoney}
                onChange={(e) => setRsvHoney(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                className="field-dark"
                type="text"
                placeholder="Nama anda"
                maxLength={40}
                autoComplete="name"
                value={rsvName}
                onChange={(e) => setRsvName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3.5">
                <select
                  className="field-dark"
                  value={rsvAttend}
                  onChange={(e) => setRsvAttend(e.target.value)}
                >
                  <option value="">— Kehadiran —</option>
                  <option value="hadir">Hadir ✦</option>
                  <option value="pasti">Belum Pasti</option>
                  <option value="tidak">Tidak Hadir</option>
                </select>
                <select
                  className="field-dark"
                  value={rsvCount}
                  onChange={(e) => setRsvCount(e.target.value)}
                >
                  <option value="1">1 orang</option>
                  <option value="2">2 orang</option>
                  <option value="3">3 orang</option>
                  <option value="4">4 orang</option>
                  <option value="5">5 orang</option>
                </select>
              </div>
              <textarea
                className="field-dark !min-h-[96px]"
                rows={3}
                placeholder="Titipkan ucapan / doa buat pengantin…"
                maxLength={220}
                value={rsvMsg}
                onChange={(e) => setRsvMsg(e.target.value)}
              />
              <button type="submit" disabled={rsvBusy} className="btn-fill w-full disabled:opacity-60">
                {rsvBusy ? "Menghantar…" : "💌  Hantar RSVP"}
              </button>
            </form>
            <div className="mt-12" data-reveal>
              <p className="mlabel !text-[10px] text-cream/50 text-center mb-4">
                Ucapan &amp; Doa <span className="text-gold-light">({wishes.length})</span>
              </p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {wishes.map((w) => (
                  <div key={w.id} className="wish-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-instrument),sans-serif",
                          fontSize: ".68rem",
                          fontWeight: 600,
                          letterSpacing: ".15em",
                          textTransform: "uppercase",
                          color: "#f6e7c1",
                        }}
                      >
                        {w.name}
                      </span>
                      <span
                        style={{
                          ...(ASTY[w.attend] || ASTY.pasti),
                          fontFamily: "var(--font-instrument),sans-serif",
                          fontSize: "9px",
                          letterSpacing: ".18em",
                          padding: "3px 12px",
                          borderRadius: "999px",
                          textTransform: "uppercase",
                        }}
                      >
                        {ALBL[w.attend] || "—"}
                      </span>
                    </div>
                    {w.msg && (
                      <p
                        style={{
                          fontStyle: "italic",
                          color: "rgba(243,233,220,.75)",
                          fontSize: "1rem",
                          marginTop: ".5rem",
                          lineHeight: 1.5,
                        }}
                      >
                        &ldquo;{w.msg}&rdquo;
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-instrument),sans-serif",
                        fontSize: ".6rem",
                        letterSpacing: ".15em",
                        color: "rgba(243,233,220,.35)",
                        marginTop: ".5rem",
                        textTransform: "uppercase",
                      }}
                    >
                      {w.count ? `${w.count} orang · ` : ""}
                      {w.time}
                    </p>
                  </div>
                ))}
                {wishes.length === 0 && (
                  <p className="font-body italic text-cream/40 text-center py-4">
                    Jadilah yang pertama menitipkan ucapan ✦
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CONTACT ═══ */}
        <section id="contact" className="py-20 md:py-28 px-5">
          <div className="max-w-md mx-auto text-center">
            <p className="script-h text-4xl md:text-5xl mb-2" data-reveal>Hubungi Kami</p>
            <p className="mlabel !text-[9px] text-cream/40 mb-8" data-reveal>
              tekan untuk salin nombor
            </p>
            <div className="space-y-3.5 text-left">
              {config.contacts.map((c) => (
                <div
                  key={c.raw}
                  className="cp-pill"
                  onClick={(e) => copyNumber(c.raw, e.currentTarget)}
                  data-reveal
                >
                  <span className="mlabel !text-[10px] text-gold-light shrink-0">{c.label}</span>
                  <span className="font-display text-base md:text-lg font-semibold tracking-wide truncate text-cream">
                    {c.display}
                  </span>
                  <span className="text-gold shrink-0">⧉</span>
                  <div className="cp-toast">TERSALIN ✦</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="bg-maroon-dark pt-20 pb-16 px-5 text-center relative overflow-hidden border-t border-gold/30">
          <div className="relative">
            <p className="script-h text-5xl md:text-7xl mb-8" data-reveal>Thank You ✦</p>
            <p className="font-display font-light text-[clamp(2rem,9vw,5rem)] leading-none text-cream" data-reveal>
              {config.bride}{" "}
              <span className="script-h text-[clamp(2rem,9vw,4rem)]">&amp;</span>{" "}
              {config.groom}
            </p>
            <p className="mlabel text-cream/50 mt-7" data-reveal>
              {config.dayLabel} · {config.dayNum} {config.monthLabel} {config.yearLabel} — {config.location}
            </p>
            <div className="flex justify-center mt-9" data-reveal>
              <span className="h-px w-16 bg-gold/50" />
            </div>
            <p className="font-body italic text-cream/40 mt-7 text-sm">
              Terima kasih &amp; wassalam.
            </p>
          </div>
        </footer>
      </main>

      {/* ═══ YT MINI PLAYER ═══ */}
      {musicStarted && !ytFailedRef.current && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-[81] transition-all duration-500 ${
            miniCollapsed
              ? "bottom-[calc(4.6rem+env(safe-area-inset-bottom))] opacity-60 hover:opacity-100"
              : "bottom-[calc(5.2rem+env(safe-area-inset-bottom))]"
          }`}
        >
          <div className="flex items-center gap-2 bg-maroon-dark/92 backdrop-blur-md border border-gold/40 rounded-full pl-1.5 pr-3 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,.5)]">
            <button
              onClick={() => setMiniCollapsed(!miniCollapsed)}
              className={`relative shrink-0 rounded-full overflow-hidden border border-gold/50 bg-maroon ${
                miniCollapsed ? "w-8 h-8" : "w-10 h-10"
              } transition-all duration-300 ${musicOn ? "yt-spin" : ""}`}
              aria-label={miniCollapsed ? "Buka pemain muzik" : "Ciut pemain muzik"}
            >
              {/* player stays mounted always; overlay hides it when collapsed */}
              <div
                ref={ytHostRef}
                className={`absolute inset-0 [&_iframe]:absolute [&_iframe]:top-1/2 [&_iframe]:left-1/2 [&_iframe]:-translate-x-1/2 [&_iframe]:-translate-y-1/2 [&_iframe]:pointer-events-none ${
                  miniCollapsed ? "opacity-0" : "opacity-100"
                } transition-opacity duration-300`}
              />
              {miniCollapsed && (
                <div className="absolute inset-0 flex items-center justify-center bg-maroon text-gold-light text-sm pointer-events-none">
                  ♪
                </div>
              )}
            </button>
            {!miniCollapsed && (
              <div className="min-w-0">
                <p className="mlabel !text-[7px] text-gold/70 leading-none">Muzik</p>
                <p className="font-body italic text-[11px] text-cream/70 leading-tight truncate max-w-[110px]">
                  {YT_TRACK_LABEL}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ACTION BAR ═══ */}
      <div id="actionBar" className={barShow ? "show" : ""}>
        <div className="max-w-md mx-auto bg-maroon-dark/95 backdrop-blur-md border-t border-gold/40 grid grid-cols-5 px-1 pt-1 pb-[calc(.55rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,.5)]">
          <button className="abtn" onClick={downloadICS}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            <span>Save Date</span>
          </button>
          <a
            className="abtn"
            href={config.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.6" />
            </svg>
            <span>Direction</span>
          </a>
          <button className="abtn" onClick={() => goTo("contact")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.96.4 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.25a2 2 0 0 1 2.1-.45c.9.34 1.8.57 2.8.7a2 2 0 0 1 1.7 2z" />
            </svg>
            <span>Contact</span>
          </button>
          <button className="abtn" onClick={() => goTo("rsvp")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span>RSVP</span>
          </button>
          <button
            className={`abtn ${musicOn ? "on" : ""}`}
            onClick={() => (mOnRef.current ? stopMusic() : startMusic())}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span>Muzik</span>
          </button>
        </div>
      </div>
    </>
  );
}
