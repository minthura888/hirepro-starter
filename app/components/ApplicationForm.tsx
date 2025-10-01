"use client";

import React, { useState } from "react";

const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || "applyyourjob_bot";

type Gender = "male" | "female";

const COUNTRIES = [
  { iso: "in", name: "India", dial: "+91" },
  { iso: "us", name: "USA/Canada", dial: "+1" },
  { iso: "mm", name: "Myanmar", dial: "+95" },
  { iso: "sg", name: "Singapore", dial: "+65" },
  { iso: "gb", name: "United Kingdom", dial: "+44" },
];

export default function ApplicationForm() {
  const [name, setName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState<string>("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const digitsOnly = (v: string) => v.replace(/\D+/g, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    if (!name.trim()) return setError("Please enter your name.");
    const local = digitsOnly(phone);
    if (!local) return setError("Please enter your Telegram phone number (digits only).");
    if (!email.trim()) return setError("Please enter a valid email.");
    const ageNum = Number(age || "0");
    if (!ageNum || ageNum < 16 || ageNum > 99) return setError("Please enter a valid age (16–99).");

    setSaving(true);
    try {
      // Fire Meta Pixel Lead (no payload required, but we can send small hints)
      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "Lead", {
          country: selectedCountry.iso,
        });
      }

      setOkMsg("Opening Telegram…");
      window.open(`https://t.me/${BOT_USERNAME}`, "_blank");

      // Reset
      setName("");
      setPhone("");
      setAge("");
      setEmail("");
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="p-6 md:p-8 rounded-2xl border border-slate-200 bg-white/70 shadow-sm">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          Recruiters will contact applicants via Telegram. Please enter the phone number used on Telegram.
        </p>

        {/* Name */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">* Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Please enter your name"
            className="mt-2 w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* Phone */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">* Telegram phone number</label>
          <div className="mt-2 grid grid-cols-10 gap-3">
            <div className="col-span-3">
              <select
                value={selectedCountry.iso}
                onChange={(e) =>
                  setSelectedCountry(
                    COUNTRIES.find((c) => c.iso === e.target.value) || COUNTRIES[0]
                  )
                }
                className="w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.iso} value={c.iso}>
                    {c.dial} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-7">
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telephone number (digits only)"
                className="w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">We’ll combine this with your country code.</p>
        </div>

        {/* Gender */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">* Gender</label>
          <div className="mt-2 flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="gender" checked={gender === "male"} onChange={() => setGender("male")} />
              Male
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="gender" checked={gender === "female"} onChange={() => setGender("female")} />
              Female
            </label>
          </div>
        </div>

        {/* Age */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">* Age</label>
          <input
            type="number"
            min={16}
            max={99}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Please enter your age"
            className="mt-2 w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* Email */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">* Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Please enter your email address"
            className="mt-2 w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* Submit */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto h-12 px-6 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60"
          >
            {saving ? "Processing…" : "Send to Telegram"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {okMsg && <p className="mt-4 text-sm text-green-600">{okMsg}</p>}
      </div>
    </form>
  );
}
