"use client";

import { useEffect, useState, useCallback } from "react";

interface Rsvp {
  id: string;
  name: string;
  attend: string;
  count: number;
  msg: string;
  createdAt: string;
}

interface Summary {
  total: number;
  hadir: number;
  pasti: number;
  tidak: number;
  totalGuests: number;
}

const ALBL: Record<string, string> = {
  hadir: "Hadir",
  pasti: "Belum Pasti",
  tidak: "Tidak Hadir",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [inputToken, setInputToken] = useState("");
  const [data, setData] = useState<{ rsvps: Rsvp[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  /* restore token from sessionStorage */
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
    } else {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("key");
      if (q) {
        setToken(q);
        sessionStorage.setItem("admin_token", q);
      }
    }
  }, []);

  const fetchRsvps = useCallback(
    async (tk: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/rsvps", {
          headers: { "x-admin-token": tk },
        });
        if (!res.ok) {
          setError(res.status === 401 ? "Token salah" : "Gagal mengambil data");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("Ralat rangkaian");
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (token) fetchRsvps(token);
  }, [token, fetchRsvps]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setToken(inputToken.trim());
    sessionStorage.setItem("admin_token", inputToken.trim());
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken("");
    setInputToken("");
    setData(null);
  }

  function downloadCsv() {
    if (!token) return;
    const a = document.createElement("a");
    a.href = `/api/admin/rsvps?token=${encodeURIComponent(token)}&format=csv`;
    a.download = "rsvp-export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* login screen */
  if (!token) {
    return (
      <div className="min-h-screen bg-maroon-deep flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h1 className="script-h text-4xl text-center mb-2">Admin RSVP</h1>
          <p className="mlabel text-gold text-center mb-8 !text-[9px]">
            Walimatulurus Amani &amp; Farhan
          </p>
          <input
            className="field-dark mb-4"
            type="password"
            placeholder="Masukkan admin token"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
          />
          <button type="submit" className="btn-fill w-full">
            Masuk
          </button>
          {error && (
            <p className="font-body italic text-red-400 text-center mt-4">{error}</p>
          )}
        </form>
      </div>
    );
  }

  const summary = data?.summary;
  const rsvps = data?.rsvps ?? [];
  const filtered = filter ? rsvps.filter((r) => r.attend === filter) : rsvps;

  return (
    <div className="min-h-screen bg-maroon-deep text-cream px-4 py-8 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="script-h text-3xl md:text-4xl">Admin RSVP</h1>
            <p className="mlabel text-gold !text-[9px] mt-1">
              Walimatulurus {""}Amani &amp; Farhan — 03 Julai 2027
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchRsvps(token)} className="btn-line !px-5 !py-2.5 !text-[10px]">
              🔄 Segar
            </button>
            <button onClick={downloadCsv} className="btn-line !px-5 !py-2.5 !text-[10px]">
              📥 CSV
            </button>
            <button onClick={handleLogout} className="btn-line !px-5 !py-2.5 !text-[10px]">
              Keluar
            </button>
          </div>
        </div>

        {/* summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Jumlah RSVP", value: summary.total, color: "#e9cf9a" },
              { label: "Hadir", value: summary.hadir, color: "#d3a94f" },
              { label: "Belum Pasti", value: summary.pasti, color: "#9fd8c2" },
              { label: "Jumlah Tetamu", value: summary.totalGuests, color: "#f6e7c1" },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-maroon border border-gold/30 rounded-xl p-4 text-center"
              >
                <p
                  className="font-display text-3xl md:text-4xl font-light"
                  style={{ color: card.color }}
                >
                  {card.value}
                </p>
                <p className="mlabel !text-[8px] text-cream/50 mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: "", label: "Semua" },
            { key: "hadir", label: "Hadir" },
            { key: "pasti", label: "Belum Pasti" },
            { key: "tidak", label: "Tidak Hadir" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-[.2em] font-semibold transition-all ${
                filter === f.key
                  ? "bg-gold text-maroon-dark"
                  : "bg-maroon text-cream/60 border border-gold/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="font-body italic text-red-400 text-center mb-4">{error}</p>
        )}
        {loading && (
          <p className="font-body italic text-cream/50 text-center py-8">Memuatkan…</p>
        )}

        {/* table */}
        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold/30">
                  <th className="mlabel !text-[8px] text-gold pb-3 pr-3">#</th>
                  <th className="mlabel !text-[8px] text-gold pb-3 pr-3">Nama</th>
                  <th className="mlabel !text-[8px] text-gold pb-3 pr-3">Kehadiran</th>
                  <th className="mlabel !text-[8px] text-gold pb-3 pr-3">Bil.</th>
                  <th className="mlabel !text-[8px] text-gold pb-3 pr-3">Ucapan</th>
                  <th className="mlabel !text-[8px] text-gold pb-3">Tarikh</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className="border-b border-cream/10 align-top">
                    <td className="py-3 pr-3 font-display italic text-gold/60">{i + 1}</td>
                    <td className="py-3 pr-3 font-display text-sm text-cream">{r.name}</td>
                    <td className="py-3 pr-3">
                      <span className="mlabel !text-[8px] px-2.5 py-1 rounded-full border border-gold/40 text-gold-light whitespace-nowrap">
                        {ALBL[r.attend] || r.attend}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-display text-cream/80">{r.count}</td>
                    <td className="py-3 pr-3 font-body italic text-cream/60 text-sm max-w-[240px]">
                      {r.msg || "—"}
                    </td>
                    <td className="py-3 font-body text-cream/40 text-xs whitespace-nowrap">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString("ms-MY", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && data && (
          <p className="font-body italic text-cream/40 text-center py-12">
            Belum ada RSVP{filter ? " untuk tapisan ini" : ""} lagi.
          </p>
        )}
      </div>
    </div>
  );
}
