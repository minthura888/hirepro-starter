'use client';

import React, { useMemo, useState } from 'react';

type Gender = 'male' | 'female';
type Country = { iso: string; dial: string; name: string };

const COUNTRIES: Country[] = [
  { iso: 'IN', dial: '+91',  name: 'India' },
  { iso: 'US', dial: '+1',   name: 'USA/Canada' },
  { iso: 'MM', dial: '+95',  name: 'Myanmar' },
  { iso: 'ID', dial: '+62',  name: 'Indonesia' },
  { iso: 'PH', dial: '+63',  name: 'Philippines' },
  { iso: 'VN', dial: '+84',  name: 'Vietnam' },
  { iso: 'TH', dial: '+66',  name: 'Thailand' },
  { iso: 'BD', dial: '+880', name: 'Bangladesh' },
  { iso: 'PK', dial: '+92',  name: 'Pakistan' },
  { iso: 'MY', dial: '+60',  name: 'Malaysia' },
  { iso: 'SG', dial: '+65',  name: 'Singapore' },
  { iso: 'AE', dial: '+971', name: 'UAE' },
  { iso: 'SA', dial: '+966', name: 'Saudi Arabia' },
  { iso: 'GB', dial: '+44',  name: 'United Kingdom' },
  { iso: 'ZA', dial: '+27',  name: 'South Africa' },
];

const flag = (iso: string) =>
  iso.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
const digitsOnly = (s: string) => (s || '').replace(/\D+/g, '');

const BOT =
  process.env.NEXT_PUBLIC_BOT_USERNAME ||
  process.env.NEXT_PUBLIC_TELEGRAM_BOT ||
  'applyyourjob_bot';

export default function ApplicationForm() {
  // form state
  const [name, setName] = useState('');
  const [countryIso, setCountryIso] = useState<string>('IN');
  const [localPhone, setLocalPhone] = useState(''); // digits only
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');

  // ui
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const selectedCountry = useMemo(
    () => COUNTRIES.find(c => c.iso === countryIso) ?? COUNTRIES[0],
    [countryIso]
  );
  const telegramLink = `https://t.me/${BOT}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);

    const phoneDigits = digitsOnly(localPhone);
    const ageNum = Number(age);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name) return setErrMsg('Please enter your name.');
    if (!phoneDigits || phoneDigits.length < 6) return setErrMsg('Please enter a valid phone number (at least 6 digits).');
    if (!emailOk) return setErrMsg('Please enter a valid email address.');
    if (!Number.isFinite(ageNum)) return setErrMsg('Please enter a valid age (numbers only).');
    if (ageNum < 18) return setErrMsg('Applicants must be 18 or older.');

    setLoading(true);

    // Pre-open to avoid popup blockers; we’ll redirect after save
    const win = window.open('about:blank');

    try {
      const dial = selectedCountry.dial;       // e.g. "+62"
      const iso  = selectedCountry.iso;        // e.g. "ID"
      const phone_e164 = `${dial}${phoneDigits}`; // simple E.164

      // Send both naming styles so the API can’t miss it
      const payload = {
        name,
        email,
        gender,
        age: ageNum,

        // modern names (what our robust API will accept)
        phone: phoneDigits,
        dial,
        countryIso: iso,

        // legacy names (what your older route expected)
        phone_e164,
        country_iso: iso,
        country_dial: dial,
      };

      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      setOkMsg('Saved! Switch to Telegram and tap /share → Accept.');
      if (win) win.location.href = telegramLink;
    } catch (err: any) {
      if (win) win.close();
      setErrMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="apply" className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Application Form</h2>

          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 p-3 text-sm">
            Recruiters will contact applicants via Telegram. Please enter the phone number used on Telegram.
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-1">* Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Please enter your name"
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <label className="block text-sm font-medium text-slate-700 mb-1">* Telegram phone number</label>
          <div className="flex gap-2 mb-1">
            <select
              value={countryIso}
              onChange={(e) => setCountryIso(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              {COUNTRIES.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {flag(c.iso)} {c.dial} — {c.name}
                </option>
              ))}
            </select>
            <input
              value={localPhone}
              onChange={(e) => setLocalPhone(digitsOnly(e.target.value))}
              inputMode="numeric"
              placeholder="Telephone number (digits only)"
              className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <p className="text-xs text-slate-500 mb-4">Enter digits only. We’ll combine it with the country code.</p>

          <label className="block text-sm font-medium text-slate-700 mb-1">* Gender</label>
          <div className="flex items-center gap-6 mb-4">
            <label className="inline-flex items-center gap-2">
              <input type="radio" className="accent-blue-600" checked={gender === 'male'} onChange={() => setGender('male')} />
              <span>Male</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" className="accent-blue-600" checked={gender === 'female'} onChange={() => setGender('female')} />
              <span>Female</span>
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-1">* Age</label>
          <input
            value={age}
            onChange={(e) => setAge(digitsOnly(e.target.value))}
            inputMode="numeric"
            placeholder="Please enter your age"
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <label className="block text-sm font-medium text-slate-700 mb-1">* Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Please enter your email address"
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Send to Telegram'}
          </button>

          <p className="mt-3 text-sm">
            If Telegram didn’t open,{' '}
            <a href={telegramLink} target="_blank" rel="noopener" className="underline">
              click here
            </a>.
          </p>

          {okMsg && <p className="mt-3 text-sm text-green-600">{okMsg}</p>}
          {errMsg && <p className="mt-3 text-sm text-red-600">{errMsg}</p>}

          <p className="mt-3 text-xs text-slate-500">
            A valid Telegram phone number must be entered to receive the work code.
          </p>
        </form>
      </div>
    </section>
  );
}
