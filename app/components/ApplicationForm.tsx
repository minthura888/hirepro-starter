'use client';

import React, { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'applyyourjob_bot';

const COUNTRIES = [
  { iso: 'in', name: 'India', dial: '+91' },       // default first
  { iso: 'us', name: 'USA/Canada', dial: '+1' },
  { iso: 'mm', name: 'Myanmar', dial: '+95' },
  { iso: 'sg', name: 'Singapore', dial: '+65' },
  { iso: 'gb', name: 'United Kingdom', dial: '+44' },
];

export default function ApplicationForm() {
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // +91 default
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  function digitsOnly(v: string) { return v.replace(/\D+/g, ''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOkMsg(null);

    if (!name.trim()) return setError('Please enter your name.');
    const local = digitsOnly(phone);
    if (!local) return setError('Please enter your Telegram phone number (digits only).');
    if (!email.trim()) return setError('Please enter a valid email.');
    const ageNum = Number(age || '0');
    if (!ageNum || ageNum < 16 || ageNum > 99) return setError('Please enter a valid age (16–99).');

    const payload = {
      name: name.trim(),
      email: email.trim(),
      countryIso: selectedCountry.iso,
      dial: selectedCountry.dial,
      phone: local,
      gender,
      age: ageNum,
      note: null as string | null,
    };

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Save failed (${res.status})`);

      setOkMsg('Saved! Opening Telegram…');

      // ✅ Fire Lead event here (only on success)
      if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
        (window as any).fbq('track', 'Lead');
      }

      // Open bot WITHOUT passing any code
      window.open(`https://t.me/${BOT_USERNAME}`, '_blank');

      setName(''); setPhone(''); setAge(''); setEmail('');
    } catch (err: any) {
      setError(err?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="card-like p-6 md:p-8">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          Recruiters will contact applicants via Telegram. Please enter the phone number used on Telegram.
        </p>

        {/* Name */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">* Name</label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Please enter your name"
            className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-3 focus:outline-none focus:ring-4 focus:ring-[var(--brand-muted)]"
          />
        </div>

        {/* Phone (3:7 grid) */}
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
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-3 focus:outline-none focus:ring-4 focus:ring-[var(--brand-muted)]"
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
                type="tel" inputMode="numeric"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Telephone number (digits only)"
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-3 focus:outline-none focus:ring-4 focus:ring-[var(--brand-muted)]"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">Enter digits only. We’ll combine it with the country code.</p>
        </div>

        {/* Gender */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">* Gender</label>
          <div className="mt-2 flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="gender" checked={gender === 'male'} onChange={() => setGender('male')} />
              <span>Male</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="gender" checked={gender === 'female'} onChange={() => setGender('female')} />
              <span>Female</span>
            </label>
          </div>
        </div>

        {/* Age */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">* Age</label>
          <input
            type="number" min={16} max={99}
            value={age} onChange={(e) => setAge(e.target.value)}
            placeholder="Please enter your age"
            className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-3 focus:outline-none focus:ring-4 focus:ring-[var(--brand-muted)]"
          />
        </div>

        {/* Email */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">* Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Please enter your email address"
            className="mt-2 w-full h-12 rounded-xl border border-slate-300 bg-white px-3 focus:outline-none focus:ring-4 focus:ring-[var(--brand-muted)]"
          />
        </div>

        {/* Submit */}
        <div className="mt-8">
          <button type="submit" disabled={saving} className="btn-primary w-full md:w-auto">
            {saving ? 'Saving…' : 'Send to Telegram'}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {okMsg && <p className="mt-4 text-sm text-green-600">{okMsg}</p>}
      </div>
    </form>
  );
}
