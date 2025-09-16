'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Rocket, Star, Globe2, CheckCircle,
  Smartphone, Monitor, IdCard, Users, Lightbulb, ChevronDown
} from 'lucide-react';
import ApplicationForm from './components/ApplicationForm'; // ← fixed relative import

const categories = [
  { name: 'Design', icon: <Star className="w-5 h-5" aria-hidden /> },
  { name: 'Marketing', icon: <Rocket className="w-5 h-5" aria-hidden /> },
  { name: 'Operations', icon: <Globe2 className="w-5 h-5" aria-hidden /> },
  { name: 'Customer Support', icon: <ShieldCheck className="w-5 h-5" aria-hidden /> },
  { name: 'Sales', icon: <Star className="w-5 h-5" aria-hidden /> },
  { name: 'Content', icon: <Star className="w-5 h-5" aria-hidden /> },
];

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      {/* Top strip */}
      <div className="w-full text-xs text-center py-2 bg-[var(--brand-muted)] text-[var(--brand)]">
        <span className="font-medium">New:</span> Hire pre-vetted part-time talent in days — no placement fees.
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center font-bold">HP</div>
            <span className="font-semibold tracking-tight">HirePro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#jobs" className="hover:text-slate-900">Jobs</a>
            <a href="#req" className="hover:text-slate-900">Requirements</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="#apply" className="btn-primary px-4">Apply now</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[var(--brand-muted)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[var(--brand)]">
            Grab our jobs
          </h1>
          <p className="mt-5 text-slate-700 text-lg">
            From everywhere! Working on the Internet gives you the opportunity to earn money anywhere.
          </p>

          {/* Trust bullets */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-slate-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>No upfront fees</span>
            <CheckCircle className="w-4 h-4" />
            <span>Average match <strong>48 hours</strong></span>
            <CheckCircle className="w-4 h-4" />
            <span>Escrow-style payments</span>
          </div>
        </div>
      </section>

      {/* Application form */}
      <ApplicationForm />

      {/* Browse by category */}
      <section id="how" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Browse by category</h2>
          <p className="text-slate-600 mt-2">Find flexible roles across popular tracks.</p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((c) => (
              <div
                key={c.name}
                className="card-like px-3 py-3 text-left flex items-center gap-2 hover:shadow-card"
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--brand-muted)] text-[var(--brand)] flex items-center justify-center">{c.icon}</div>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* We are hiring */}
      <section id="jobs" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">We are hiring: part-time and full-time!</h2>

          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            <Card title="Do a part-time job">
              <ul className="space-y-2 text-slate-700">
                <li>Depending on the completion of the task, you can earn <strong>200–1500 rupee per day</strong></li>
                <li><strong>Daily payment</strong> after task completion</li>
                <li>Work <strong>1–3 hours</strong> a day</li>
                <li>Use your phone to complete simple online tasks</li>
                <li>Digital knowledge is an advantage</li>
                <li>Flexible work-from-home hours</li>
              </ul>
            </Card>

            <Card title="Full-time">
              <ul className="space-y-2 text-slate-700">
                <li>Depending on the completion of the task, you can earn a <strong>minimum of more than 3,000 rupee per day</strong></li>
                <li>Work <strong>1–3 hours</strong> a day</li>
                <li>Use your phone to complete simple online tasks</li>
                <li>Digital knowledge is an advantage</li>
                <li>Flexible work-from-home hours</li>
              </ul>
            </Card>

            <Card title="Flexible part-time work with a generous bonus!">
              <ul className="space-y-3 text-slate-700">
                <li><strong>Work for 5 consecutive days:</strong> After 5 days of continuous work, you will receive a handsome bonus.</li>
                <li><strong>Extended to 15 days:</strong> Work for 15 consecutive days and we’ll reward you with more than double the initial amount.</li>
                <li><strong>Commitment throughout the month:</strong> Stay with us for a full 30 days and you will get <strong>8×</strong> the first amount.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Dark promo + stats */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">{/* ← mx-auto fixed */}
          <div
            className="rounded-2xl p-8 sm:p-10 text-white"
            style={{ background: `linear-gradient(0deg, rgba(37,99,235,0.25), rgba(37,99,235,0.25)), #0f172a` }}
          >
            <p className="text-blue-300 font-semibold">Find your job here!</p>
            <h3 className="text-3xl sm:text-4xl font-bold mt-2">Truly work from home (or wherever you want)</h3>
            <p className="mt-3 text-white/80 max-w-3xl">
              Work flexibly, set your own schedule, and spend more time with family and friends. Complete tasks from any online device.
            </p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <Stat number="183,2+" label="APPLICANT" />
              <Stat number="12,500+" label="PROVIDED TASK" />
              <Stat number="300+" label="OUR TEAM" />
              <Stat number="4.81" label="SATISFACTION" />
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section id="req" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">job requirement</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <Req icon={<Smartphone className="w-5 h-5" />} text="Your phone can be your source of income" />
            <Req icon={<Monitor className="w-5 h-5" />} text="Own a smartphone" />
            <Req icon={<IdCard className="w-5 h-5" />} text="Anyone over the age of 23 can apply" />
            <Req icon={<Users className="w-5 h-5" />} text="Male and female" />
            <Req icon={<Lightbulb className="w-5 h-5" />} text="The advantage of digital knowledge" />
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-6">
          {[
            { icon: <ShieldCheck className="w-5 h-5" />, title: 'Trust & safety', desc: 'Milestone-based payouts and ID verification.' },
            { icon: <Rocket className="w-5 h-5" />, title: 'Within 1–2 days', desc: 'Most applicants start within 1–2 days after submitting the form.' },
            { icon: <Star className="w-5 h-5" />, title: 'Curated talent', desc: 'We vet skills, availability, and timezone fit.' },
          ].map((f) => (
            <div key={f.title} className="card-like p-6">
              <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-[var(--brand-muted)] text-[var(--brand)]">
                {f.icon}
              </div>
              <p className="font-semibold">{f.title}</p>
              <p className="text-slate-600 mt-2 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-3xl font-semibold">Ready to apply?</h3>
            <p className="mt-2 text-slate-300">Fill the form and a recruiter will contact you via Telegram.</p>
          </div>
          <div className="flex gap-3">
            <Link href="#apply" className="btn-primary px-6">Apply now</Link>
            <button className="btn-secondary px-6">Contact support</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm text-slate-600">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center font-bold mb-3">HP</div>
            <p>HirePro helps teams find reliable part-time talent worldwide.</p>
          </div>
          <Column title="Company" items={['About', 'Careers', 'Blog']} />
          <Column title="Support" items={['Help Center', 'Safety', 'Contact']} />
          <Column title="Legal" items={['Terms', 'Privacy', 'Cookies']} />
        </div>
        <div className="text-xs text-slate-400 text-center mt-6">
          © {new Date().getFullYear()} HirePro, Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/* ---------- helpers ---------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-like p-6">
      <p className="text-lg font-bold text-[var(--brand)] mb-3">{title}</p>
      {children}
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col">
      <div className="text-2xl font-semibold">{number}</div>
      <div className="text-[10px] tracking-widest text-white/70">{label}</div>
    </div>
  );
}

function Req({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="
          size-12 shrink-0 rounded-full
          bg-[var(--brand)] text-white
          grid place-items-center
          ring-4 ring-[var(--brand-muted)]
        "
      >
        <div className="w-[18px] h-[18px]">{icon}</div>
      </div>
      <p className="text-sm leading-snug">{text}</p>
    </div>
  );
}

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-semibold text-slate-900 mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map((t) => (
          <li key={t}><a className="hover:underline" href="#">{t}</a></li>
        ))}
      </ul>
    </div>
  );
}

function FAQSection() {
  const items = [
    { q: 'Who can apply?', a: 'Anyone 23+, male or female, with a smartphone and internet connection.' },
    { q: 'Is this remote?', a: 'Yes — fully remote. You can work from anywhere.' },
    { q: 'How do I apply?', a: 'Fill the Application Form and submit. A recruiter will contact you on Telegram.' },
    { q: 'How fast can I start?', a: 'Most applicants start within 1–2 days after submitting the form.' },
    { q: 'How many hours per day?', a: 'Typically 1–3 hours per day. Flexible schedule.' },
  ];
  return (
    <section id="faq" className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6 text-[var(--brand)]">Frequently asked questions</h2>
        <div className="space-y-3">
          {items.map((it, i) => <FAQItem key={i} q={it.q} a={it.a} />)}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card-like ${open ? 'ring-2 ring-[var(--brand)]' : ''}`}>
      <button className="w-full flex items-center justify-between text-left p-4 sm:p-5" onClick={() => setOpen(!open)}>
        <span className="font-semibold">{q}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 pt-0 text-slate-600 border-t border-slate-100">
          {a}
        </div>
      )}
    </div>
  );
}
