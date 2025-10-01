'use client';

import React, { useMemo, useState } from 'react';
import { fbqTrack } from '@/lib/pixel';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'applyyourjob_bot';

const COUNTRIES = [
  { iso: 'in', name: 'India', dial: '+91' },
  { iso: 'us', name: 'USA/Canada', dial: '+1' },
  { iso: 'mm', name: 'Myanmar', dial: '+95' },
  { iso: 'sg', name: 'Singapore', dial: '+65' },
  { iso: 'gb', name: 'United Kingdom', dial: '+44' },
];

const isMobileUA = () =>
  /iPhone|iPad|iPod|Android/i.test(typeof navigator === 'undefined' ? '' : navigator.userAgent);

const onlyDigits = (v: string) => v.replace(/\D+/g, '');

export default function ApplicationForm() {
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const phoneE164 = useMemo(() => {
    const cc = onlyDigits(selectedCountry.dial);
    const local = onlyDigits(phone);
    if (!cc || !local) return '';
    return `+${cc}${local}`;
  }, [selectedCountry, phone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter a valid email.'); return; }
    const ageNum = Number(age || '0');
    if (!ageNum || ageNum < 16 || ageNum > 99) { setError('Please enter a valid age (16–99).'); return; }
    if (!phoneE164) { setError('Please enter your Telegram phone number.'); return; }

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

    try {
      const body = JSON.stringify(payload);
      const url = `${API_BASE}/api/lead`;
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, /* @ts-ignore */ keepalive: true });
      }
    } catch {}

    const tgApp = `tg://resolve?domain=${BOT_USERNAME}`;
    const tgWeb = `https://t.me/${BOT_USERNAME}`;
    const tgIntent = `intent://resolve?domain=${BOT_USERNAME}#Intent;scheme=tg;package=org.telegram.messenger;end`;

    setTimeout(() => {
      if (isMobileUA()) {
        location.href = tgApp;
        setTimeout(() => {
          if (document.visibilityState === 'hidden') return;
          const isAndroid = /Android/i.test(navigator.userAgent);
          if (isAndroid) {
            location.href = tgIntent;
            setTimeout(() => {
              if (document.visibilityState === 'hidden') return;
              location.href = tgWeb;
            }, 500);
          } else {
            location.href = tgWeb;
          }
        }, 700);
      } else {
        window.open(tgWeb, '_blank', 'noopener,noreferrer');
      }
    }, 120);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      {/* ... keep your JSX fields exactly as before ... */}
    </form>
  );
}
