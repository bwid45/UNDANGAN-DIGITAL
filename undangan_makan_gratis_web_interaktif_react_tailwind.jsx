import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { QRCodeCanvas } from "qrcode.react";

// ================== Helper Components ==================
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

function useCountdown(targetDateISO) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(targetDateISO);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { days, hours, minutes, seconds, isOver: diff === 0 };
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-2xl border px-3 py-1 text-sm bg-white/70 dark:bg-white/5 backdrop-blur shadow-sm">
      {children}
    </span>
  );
}

// ================== Main Component ==================
export default function GratisMakanInvite() {
  // ------- CONFIG (editable) -------
  const [config, setConfig] = useLocalStorage("inviteConfig", {
    title: "Undangan Makan Gratis!",
    subtitle: "Ajak teman, kenyangkan perut—gratis tuntas.",
    host: "Warung SatSet",
    dateISO: new Date("2025-08-17T08:00:00").toISOString(), // 17 Agustus jam 8 pagi
    locationName: "RokcDinner",
    address: "RokcDinner, Jakarta",
    gmapsQuery: "RokcDinner Jakarta",
    dressCode: "Casual nyaman",
    perks: ["Makan & minum gratis", "Live acoustic", "Doorprize"],
    contactPhone: "+6281234567890",
    website: "",
  });

  const [dark, setDark] = useLocalStorage("inviteDark", true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Personalization via URL ?to=
  const params = new URLSearchParams(window.location.search);
  const guestName = params.get("to");

  // Countdown
  const c = useCountdown(config.dateISO);

  // RSVP
  const [rsvps, setRsvps] = useLocalStorage("rsvpList", []);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [form, setForm] = useState({
    name: guestName || "",
    phone: "",
    pax: 1,
    diet: "Bebas",
    notes: "",
  });

  const eventUrl = useMemo(() => {
    const url = new URL(window.location.href);
    if (guestName) return url.toString();
    url.searchParams.set("to", form.name || "Tamu Istimewa");
    return url.toString();
  }, [guestName, form.name]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Nama wajib diisi");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const payload = {
        ...form,
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
      };
      setRsvps([...rsvps, payload]);
      setSubmitting(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      // reset phone & notes only
      setForm((f) => ({ ...f, phone: "", notes: "" }));
    }, 500);
  }

  function copyLink() {
    navigator.clipboard.writeText(eventUrl).then(() => alert("Link undangan disalin!"));
  }

  function shareWA() {
    const msg = encodeURIComponent(
      `Halo${guestName ? " " + guestName : ""}!\n\nKamu diundang makan GRATIS 🎉\n${config.title} oleh ${config.host}\n📅 ${new Date(config.dateISO).toLocaleString()}\n📍 ${config.locationName} – ${config.address}\n\nKonfirmasi kehadiran di link ini ya:\n${eventUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  function printTicket() {
    window.print();
  }

  const ticketData = useMemo(() => {
    return {
      n: form.name || guestName || "Tamu Istimewa",
      d: new Date(config.dateISO).toLocaleString(),
      l: `${config.locationName} - ${config.address}`,
      h: config.host,
      id: rsvps.length,
    };
  }, [form.name, guestName, config, rsvps.length]);

  const perks = (config.perks || []).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <AnimatePresence>{showConfetti && <Confetti recycle={false} numberOfPieces={400} />}</AnimatePresence>

      {/* Floating emoji background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {["🍜","🍗","🍣","🍛","🍰","🥤"].map((emo, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-20"
            initial={{ y: -50, x: Math.random() * window.innerWidth }}
            animate={{ y: [0, window.innerHeight + 50], rotate: [0, 360] }}
            transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
            style={{ left: `${(i + 1) * 12}%` }}
          >
            {emo}
          </motion.div>
        ))}
      </div>

      {/* Container */}
      <div className="relative mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍽️</span>
            <span className="font-semibold">{config.host}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              className="rounded-2xl border px-3 py-1 text-sm hover:bg-white/60 dark:hover:bg-white/10"
              aria-label="Toggle dark mode"
            >
              {dark ? "☀️ Terang" : "🌙 Gelap"}
            </button>
            <button
              onClick={() => {
                const next = prompt("Ubah judul acara:", config.title) ?? config.title;
                setConfig({ ...config, title: next });
              }}
              className="rounded-2xl border px-3 py-1 text-sm hover:bg-white/60 dark:hover:bg-white/10"
            >
              ⚙️ Edit Judul
            </button>
          </div>
        </div>

        {/* Hero */}
        <section className="mt-8 grid items-center gap-6 md:grid-cols-2">
          <div>
            <motion.h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {config.title}
            </motion.h1>
            <p className="mt-2 text-lg opacity-80">{config.subtitle}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {guestName && <Pill>Untuk: <strong className="ml-1">{guestName}</strong></Pill>}
              <Pill>📅 {new Date(config.dateISO).toLocaleString()}</Pill>
              <Pill>📍 {config.locationName}</Pill>
              <Pill>👗 {config.dressCode}</Pill>
            </div>

            {/* Countdown */}
            <div className="mt-6">
              <div className="grid grid-cols-4 gap-2 w-fit rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur p-3 shadow">
                {[{k:"Hari",v:c.days},{k:"Jam",v:c.hours},{k:"Menit",v:c.minutes},{k:"Detik",v:c.seconds}].map((it,i)=> (
                  <div key={i} className="text-center">
                    <div className="text-3xl font-bold tabular-nums">{String(it.v).padStart(2,'0')}</div>
                    <div className="text-xs opacity-70">{it.k}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {perks.map((p, i) => (
                  <span key={i} className="text-sm opacity-80">• {p}</span>
                ))}
              </div>
            </div>

            {/* Share */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={copyLink} className="rounded-xl px-4 py-2 border hover:bg-white/60 dark:hover:bg-white/10">Salin Link</button>
              <button onClick={shareWA} className="rounded-xl px-4 py-2 border hover:bg-white/60 dark:hover:bg-white/10">Bagikan via WhatsApp</button>
              <button onClick={printTicket} className="rounded-xl px-4 py-2 border hover:bg-white/60 dark:hover:bg-white/10">Cetak Tiket</button>
            </div>
          </div>

          {/* Ticket Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="rounded-3xl border bg-white/80 dark:bg-white/5 backdrop-blur p-5 shadow-2xl [--cut:18px] before:content-[''] before:absolute before:top-1/2 before:-left-[--cut] before:-translate-y-1/2 before:w-[--cut] before:h-[--cut] before:rounded-full before:bg-amber-50 dark:before:bg-slate-900 after:content-[''] after:absolute after:top-1/2 after:-right-[--cut] after:-translate-y-1/2 after:w-[--cut] after:h-[--cut] after:rounded-full after:bg-amber-50 dark:after:bg-slate-900 print:shadow-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm opacity-70">Tiket Undangan</div>
                  <div className="text-2xl font-bold">{config.host}</div>
                </div>
                <QRCodeCanvas value={JSON.stringify(ticketData)} size={96} includeMargin className="rounded bg-white p-1" />
              </div>
              <div className="mt-4">
                <div className="text-xl">Atas nama: <strong>{ticketData.n}</strong></div>
                <div className="opacity-80 mt-1">{ticketData.d}</div>
                <div className="opacity-80">{ticketData.l}</div>
              </div>
              <div className="mt-4 text-sm opacity-70">Tunjukkan QR ini saat datang. 📎 ID: #{ticketData.id}</div>
            </div>
          </motion.div>
        </section>

        {/* RSVP Form */}
        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <form onSubmit={handleSubmit} className="md:col-span-2 rounded-3xl border bg-white/80 dark:bg-white/5 backdrop-blur p-6 shadow">
            <h2 className="text-2xl font-bold mb-2">Konfirmasi Kehadiran (RSVP)</h2>
            <p className="mb-4 opacity-80">Bantu kami menyiapkan porsi terbaik untukmu 😉</p>

            <Field label="Nama">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama lengkap"
                className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-slate-900/50"
              />
            </Field>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="No. WhatsApp">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxx"
                  className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-slate-900/50"
                />
              </Field>
              <Field label="Jumlah orang (pax)">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.pax}
                  onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })}
                  className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-slate-900/50"
                />
              </Field>
              <Field label="Preferensi makanan">
                <select
                  value={form.diet}
                  onChange={(e) => setForm({ ...form, diet: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-slate-900/50"
                >
                  <option>Bebas</option>
                  <option>Tanpa Pedas</option>
                  <option>Vegetarian</option>
                  <option>Vegan</option>
                  <option>Tanpa Gluten</option>
                </select>
              </Field>
            </div>

            <Field label="Catatan">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Alergi, datang jam berapa, dll."
                className="w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-slate-900/50"
                rows={3}
              />
            </Field>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl border px-5 py-2 font-medium hover:bg-white/60 dark:hover:bg-white/10 disabled:opacity-60"
              >
                {submitting ? "Menyimpan…" : "Kirim RSVP"}
              </button>
              <button
                type="button"
                onClick={() => setForm({ name: guestName || "", phone: "", pax: 1, diet: "Bebas", notes: "" })}
                className="rounded-2xl border px-4 py-2 hover:bg-white/60 dark:hover:bg-white/10"
              >
                Reset
              </button>
            </div
