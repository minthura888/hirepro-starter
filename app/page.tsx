// app/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Rocket,
  Star,
  Globe2,
  CheckCircle,
  Smartphone,
  Monitor,
  IdCard,
  Users,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import ApplicationForm from "./components/ApplicationForm";

const categories = [
  { name: "Tasarım", icon: <Star className="w-5 h-5" aria-hidden /> },
  { name: "Pazarlama", icon: <Rocket className="w-5 h-5" aria-hidden /> },
  { name: "Operasyon", icon: <Globe2 className="w-5 h-5" aria-hidden /> },
  { name: "Müşteri Desteği", icon: <ShieldCheck className="w-5 h-5" aria-hidden /> },
  { name: "Satış", icon: <Star className="w-5 h-5" aria-hidden /> },
  { name: "İçerik", icon: <Star className="w-5 h-5" aria-hidden /> },
];

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      <div className="w-full text-xs text-center py-2 bg-[var(--brand-muted)] text-[var(--brand)]">
        <span className="font-medium">Yeni:</span> Önceden değerlendirilmiş yarı zamanlı işleri günler içinde almaya başlayın — başvuru ücreti yok.
      </div>

      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center font-bold">HP</div>
            <span className="font-semibold tracking-tight">HirePro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#how" className="hover:text-slate-900">Nasıl çalışır?</a>
            <a href="#jobs" className="hover:text-slate-900">İşler</a>
            <a href="#req" className="hover:text-slate-900">Şartlar</a>
            <a href="#faq" className="hover:text-slate-900">SSS</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="#apply" className="btn-primary px-4">Hemen başvur</Link>
          </div>
        </div>
      </header>

      <section className="relative bg-[var(--brand-muted)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[var(--brand)]">
            İşinizi hemen alın
          </h1>
          <p className="mt-5 text-slate-700 text-lg">
            Her yerden çalışın! İnternet üzerinden çalışmak, bulunduğunuz yerden para kazanma fırsatı sunar.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-slate-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Ön ödeme yok</span>
            <CheckCircle className="w-4 h-4" />
            <span>Ortalama eşleşme <strong>48 saat</strong></span>
            <CheckCircle className="w-4 h-4" />
            <span>Güvenli ödeme sistemi</span>
          </div>
        </div>
      </section>

      <ApplicationForm />

      <section id="how" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Kategoriye göre göz atın</h2>
          <p className="text-slate-600 mt-2">Popüler alanlarda esnek çalışma fırsatlarını bulun.</p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((c) => (
              <div key={c.name} className="card-like px-3 py-3 text-left flex items-center gap-2 hover:shadow-card">
                <div className="w-8 h-8 rounded-xl bg-[var(--brand-muted)] text-[var(--brand)] flex items-center justify-center">
                  {c.icon}
                </div>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="jobs" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Yarı zamanlı ve tam zamanlı işler için başvuru alıyoruz!</h2>

          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            <Card title="Yarı zamanlı iş yapın">
              <ul className="space-y-2 text-slate-700">
                <li>Görevin tamamlanmasına bağlı olarak günde <strong>200–1500 TL</strong> kazanabilirsiniz</li>
                <li>Görev tamamlandıktan sonra <strong>günlük ödeme</strong></li>
                <li>Günde <strong>1–3 saat</strong> çalışma</li>
                <li>Basit online görevleri telefonunuzla tamamlayın</li>
                <li>Dijital bilgi avantaj sağlar</li>
                <li>Evden esnek çalışma saatleri</li>
              </ul>
            </Card>

            <Card title="Tam zamanlı">
              <ul className="space-y-2 text-slate-700">
                <li>Görevin tamamlanmasına bağlı olarak günde <strong>en az 3.000 TL’den fazla</strong> kazanabilirsiniz</li>
                <li>Günde <strong>1–3 saat</strong> çalışma</li>
                <li>Basit online görevleri telefonunuzla tamamlayın</li>
                <li>Dijital bilgi avantaj sağlar</li>
                <li>Evden esnek çalışma saatleri</li>
              </ul>
            </Card>

            <Card title="Cömert bonuslu esnek yarı zamanlı çalışma!">
              <ul className="space-y-3 text-slate-700">
                <li><strong>5 gün üst üste çalışın:</strong> 5 gün sürekli çalıştıktan sonra güzel bir bonus alırsınız.</li>
                <li><strong>15 güne uzatın:</strong> 15 gün üst üste çalışın, ilk miktarın iki katından fazla ödül kazanın.</li>
                <li><strong>Ay boyunca devam edin:</strong> Tam 30 gün bizimle kalırsanız ilk miktarın <strong>8 katı</strong> bonus kazanırsınız.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl p-8 sm:p-10 text-white"
            style={{ background: `linear-gradient(0deg, rgba(37,99,235,0.25), rgba(37,99,235,0.25)), #0f172a` }}
          >
            <p className="text-blue-300 font-semibold">İşinizi burada bulun!</p>
            <h3 className="text-3xl sm:text-4xl font-bold mt-2">Gerçekten evden çalışın</h3>
            <p className="mt-3 text-white/80 max-w-3xl">
              Esnek çalışın, kendi programınızı belirleyin ve ailenizle daha fazla zaman geçirin. Görevleri herhangi bir online cihazdan tamamlayın.
            </p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <Stat number="183,2+" label="BAŞVURU" />
              <Stat number="12,500+" label="VERİLEN GÖREV" />
              <Stat number="300+" label="EKİBİMİZ" />
              <Stat number="4.81" label="MEMNUNİYET" />
            </div>
          </div>
        </div>
      </section>

      <section id="req" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">İş şartları</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <Req icon={<Smartphone className="w-5 h-5" />} text="Telefonunuz gelir kaynağınız olabilir" />
            <Req icon={<Monitor className="w-5 h-5" />} text="Akıllı telefona sahip olun" />
            <Req icon={<IdCard className="w-5 h-5" />} text="23 yaş üzerindeki herkes başvurabilir" />
            <Req icon={<Users className="w-5 h-5" />} text="Kadın ve erkek adaylar başvurabilir" />
            <Req icon={<Lightbulb className="w-5 h-5" />} text="Dijital bilgi avantaj sağlar" />
          </div>
        </div>
      </section>

      <section id="why" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-6">
          {[
            { icon: <ShieldCheck className="w-5 h-5" />, title: "Güven ve emniyet", desc: "Aşamalı ödemeler ve kimlik doğrulama." },
            { icon: <Rocket className="w-5 h-5" />, title: "1–2 gün içinde", desc: "Çoğu başvuru sahibi formu gönderdikten sonra 1–2 gün içinde başlar." },
            { icon: <Star className="w-5 h-5" />, title: "Seçilmiş adaylar", desc: "Becerileri, uygunluğu ve çalışma saatlerini değerlendiriyoruz." },
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

      <FAQSection />

      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-3xl font-semibold">Başvurmaya hazır mısınız?</h3>
            <p className="mt-2 text-slate-300">Formu doldurun, işe alım ekibi Telegram üzerinden sizinle iletişime geçsin.</p>
          </div>
          <div className="flex gap-3">
            <Link href="#apply" className="btn-primary px-6">Hemen başvur</Link>
            <button className="btn-secondary px-6">Destek ile iletişime geç</button>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm text-slate-600">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center font-bold mb-3">HP</div>
            <p>HirePro, güvenilir yarı zamanlı işleri bulmanıza yardımcı olur.</p>
          </div>
          <Column title="Şirket" items={["Hakkımızda", "Kariyer", "Blog"]} />
          <Column title="Destek" items={["Yardım Merkezi", "Güvenlik", "İletişim"]} />
          <Column title="Yasal" items={["Şartlar", "Gizlilik", "Çerezler"]} />
        </div>
        <div className="text-xs text-slate-400 text-center mt-6">
          © {new Date().getFullYear()} HirePro, Inc. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}

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
      <div className="size-12 shrink-0 rounded-full bg-[var(--brand)] text-white grid place-items-center ring-4 ring-[var(--brand-muted)]">
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
          <li key={t}>
            <a className="hover:underline" href="#">{t}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQSection() {
  const items = [
    { q: "Kimler başvurabilir?", a: "23 yaş ve üzeri, akıllı telefonu ve internet bağlantısı olan herkes başvurabilir." },
    { q: "Bu iş uzaktan mı?", a: "Evet, tamamen uzaktan. İstediğiniz yerden çalışabilirsiniz." },
    { q: "Nasıl başvurabilirim?", a: "Başvuru formunu doldurun ve gönderin. İşe alım ekibi Telegram üzerinden sizinle iletişime geçecektir." },
    { q: "Ne kadar hızlı başlayabilirim?", a: "Çoğu başvuru sahibi formu gönderdikten sonra 1–2 gün içinde başlar." },
    { q: "Günde kaç saat çalışmam gerekiyor?", a: "Genellikle günde 1–3 saat. Çalışma programı esnektir." },
  ];

  return (
    <section id="faq" className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6 text-[var(--brand)]">Sıkça sorulan sorular</h2>
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
    <div className={`card-like ${open ? "ring-2 ring-[var(--brand)]" : ""}`}>
      <button className="w-full flex items-center justify-between text-left p-4 sm:p-5" onClick={() => setOpen(!open)}>
        <span className="font-semibold">{q}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 pt-0 text-slate-600 border-t border-slate-100">
          {a}
        </div>
      )}
    </div>
  );
}
