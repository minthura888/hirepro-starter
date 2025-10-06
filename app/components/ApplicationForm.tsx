'use client';

import React, { useMemo, useState } from 'react';
import { fbqTrack } from '@/lib/pixel';

const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'applyyourjob_bot';

// Minimal list with India default; add more if you like
const COUNTRIES = [
  { iso: 'in', name: 'India', dial: '+91' },
  { iso: 'us', name: 'United States/Canada', dial: '+1' },
  { iso: 'my', name: 'Malaysia', dial: '+60' },
  { iso: 'id', name: 'Indonesia', dial: '+62' },
  { iso: 'ph', name: 'Philippines', dial: '+63' },
  { iso: 'vn', name: 'Vietnam', dial: '+84' },
  { iso: 'th', name: 'Thailand', dial: '+66' },
  { iso: 'mm', name: 'Myanmar', dial: '+95' },
  { iso: 'bd', name: 'Bangladesh', dial: '+880' },
  { iso: 'pk', name: 'Pakistan', dial: '+92' },
  { iso: 'np', name: 'Nepal', dial: '+977' },
  { iso: 'lk', name: 'Sri Lanka', dial: '+94' },
  { iso: 'au', name: 'Australia', dial: '+61' },
  { iso: 'za', name: 'South Africa', dial: '+27' },
  { iso: 'de', name: 'Germany', dial: '+49' },
  { iso: 'fr', name: 'France', dial: '+33' },
  { iso: 'gb', name: 'United Kingdom', dial: '+44' },
  { iso: 'ae', name: 'United Arab Emirates', dial: '+971' },
  { iso: 'sg', name: 'Singapore', dial: '+65' },
];

const isMobile = () =>
  /iPhone|iPad|iPod|Android/i.test(typeof navigator === 'undefined' ? '' : navigator.userAgent);
const onlyDigits = (v: string) => v.replace(/\D+/g, '');

export default function ApplicationForm() {
  // fields
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // India default
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('');
  const [email, setEmail] = useState('');

  // ui state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const phoneE164 = useMemo(() => {
    const cc = onlyDigits(selectedCountry.dial);
    const local = onlyDigits(phone);
    return cc && local ? `+${cc}${local}` : '';
  }, [selectedCountry, phone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    // quick validations
    const ageNum = Number(age || '0');
    if (!name.trim()) return setError('Please enter your name.');
    if (!email.trim()) return setError('Please enter a valid email.');
    if (!phoneE164) return setError('Please enter your Telegram phone number.');
    if (!ageNum || ageNum < 16 || ageNum > 99) return setError('Please enter a valid age (16–99).');

    // payload (NO ip here — API will record IP from request headers)
    const payload = {
      name: name.trim(),
      email: email.trim(),
      countryIso: selectedCountry.iso,
      dial: selectedCountry.dial,
      phone: onlyDigits(phone),
      phoneE164,
      gender,
      age: ageNum,
      note: null as string | null,
    };

    try { fbqTrack('Lead', { action: 'form_submit' }); } catch {}

    setSaving(true);
    setOkMsg('Saved! Opening Telegram…');

    // Send to our own API route (same origin) to avoid CORS
    const url = '/api/lead';
    try {
      const body = JSON.stringify(payload);
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          // @ts-ignore
          keepalive: true,
        });
      }
    } catch {
      /* ignore network errors here – we already proceed to open Telegram */
    }

    // Deep link to Telegram bot
    const tgWeb = `https://t.me/${BOT_USERNAME}`;
    const tgApp = `tg://resolve?domain=${BOT_USERNAME}`;
    const tgIntent = `intent://resolve?domain=${BOT_USERNAME}#Intent;scheme=tg;package=org.telegram.messenger;end`;

    setTimeout(() => {
      if (isMobile()) {
        location.href = tgApp;
        setTimeout(() => {
          if (document.visibilityState === 'hidden') return;
          const onAndroid = /Android/i.test(navigator.userAgent);
          if (onAndroid) {
            location.href = tgIntent;
            setTimeout(() => {
              if (document.visibilityState === 'hidden') return;
              location.href = tgWeb;
            }, 400);
          } else {
            location.href = tgWeb;
          }
        }, 600);
      } else {
        window.open(tgWeb, '_blank', 'noopener,noreferrer');
      }
    }, 120);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="p-6 md:p-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          Recruiters will contact applicants via Telegram. Please enter the phone number used on Telegram.
        </p>

        {/* Name */}
        <label className="block text-sm font-medium text-slate-700 mt-2">* Name</label>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />

        {/* Phone with country */}
        <label className="block text-sm font-medium text-slate-700 mt-6">* Telegram phone number</label>
        <div className="mt-2 grid grid-cols-10 gap-3">
          <select
            value={selectedCountry.iso}
            onChange={(e) =>
              setSelectedCountry(COUNTRIES.find((c) => c.iso === e.target.value) || COUNTRIES[0])
            }
            className="col-span-3 h-12 rounded-xl border border-slate-300 px-3 bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>{c.dial} — {c.name}</option>
            ))}
          </select>
          <input
            className="col-span-7 h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
            type="tel"
            inputMode="numeric"
            placeholder="Digits only"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          We will verify this exact number with Telegram:&nbsp;<strong>{phoneE164 || '—'}</strong>
        </p>

        {/* Gender */}
        <label className="block text-sm font-medium text-slate-700 mt-6">* Gender</label>
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

        {/* Age */}
        <label className="block text-sm font-medium text-slate-700 mt-6">* Age</label>
        <input
          type="number"
          min={16}
          max={99}
          placeholder="Your age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="mt-2 w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />

        {/* Email */}
        <label className="block text-sm font-medium text-slate-700 mt-6">* Email</label>
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full h-12 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="submit"
          disabled={saving}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-6 h-12 hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {okMsg && <p id="apply-status" className="mt-4 text-sm text-green-600">{okMsg}</p>}
      </div>
    </form>
  );
}
