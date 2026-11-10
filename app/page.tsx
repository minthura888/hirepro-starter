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
  { name: "Tasarım", icon: <Star className="h-5 w-5" aria-hidden /> },
  { name: "Pazarlama", icon: <Rocket className="h-5 w-5" aria-hidden /> },
  { name: "Operasyon", icon: <Globe2 className="h-5 w-5" aria-hidden /> },
  { name: "Müşteri Desteği", icon: <ShieldCheck className="h-5 w-5" aria-hidden /> },
  { name: "Satış", icon: <Star className="h-5 w-5" aria-hidden /> },
  { name: "İçerik", icon: <Star className="h-5 w-5" aria-hidden /> },
];

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-[var(--page)] text-[var(--text)]">
      <div className="border-b border-[#f3d3c4] bg-[#fff0e8] px-3 py-1.5 text-center text-[11px] leading-snug text-[#8f5a43] sm:text-xs">
        <span className="font-semibold text-[var(--brand)]">Yeni:</span>{" "}
        Esnek online iş fırsatları — başvuru ücreti yok.
      </div>

      <header className="sticky top-0 z-30 border-b border-[#f1ddd4] bg-[#fffaf7]/95 backdrop-blur-xl">
        <div className="container-page flex h-14 items-center justify-between gap-3 sm:h-16">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand)] font-black text-[#ffffff] shadow-lg shadow-yellow-500/10 sm:h-9 sm:w-9 sm:rounded-xl">HP</div>
            <span className="font-semibold tracking-tight text-[#4a312a]">HirePro</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#7e6a63] md:flex">
            <a href="#how" className="nav-link">Nasıl çalışır?</a>
            <a href="#jobs" className="nav-link">Fırsatlar</a>
            <a href="#req" className="nav-link">Şartlar</a>
            <a href="#faq" className="nav-link">SSS</a>
          </nav>
          <Link href="#apply" className="btn-primary whitespace-nowrap px-4 py-2.5 text-sm sm:px-5">Hemen başvur</Link>
        </div>
      </header>

      <main>
        <section className="border-b border-[#f2ddd4] bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.13),_transparent_42%)]">
          <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-7 md:py-8">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#f2c7b2] bg-[#fff0e8] px-2.5 py-1 text-[11px] font-medium text-[#8f5a43] sm:text-xs">
              <span aria-hidden>🇹🇷</span> Türkiye
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#3f2d28] sm:text-4xl md:text-5xl">
              <span className="text-[var(--brand)]">Bugün</span> başlayın
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7b6962] sm:mt-3 sm:text-base md:text-lg">
              Esnek ve uzaktan çalışın. Günlük programınıza uyabilecek online iş fırsatlarını keşfedin.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#826f68] sm:mt-4 sm:text-sm">
              <HeroPoint text="Başvuru ücreti yok" />
              <HeroPoint text="Basit başvuru süreci" />
              <HeroPoint text="Esnek çalışma fırsatları" />
            </div>
          </div>
        </section>

        <section className="container-page py-4 sm:py-6"><ApplicationForm /></section>

        <section id="how" className="section-compact border-t border-[#f1ddd4]">
          <div className="container-page">
            <SectionHeading eyebrow="Alanlar" title="Kategoriye göre fırsatları keşfedin" description="Farklı alanlardaki esnek çalışma seçeneklerini inceleyin." />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <div key={category.name} className="card-like flex items-center gap-2.5 px-3 py-3.5 transition hover:-translate-y-0.5 hover:border-[#f2b58f]">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fff0e8] text-[var(--brand)]">{category.icon}</div>
                  <span className="text-sm font-medium text-[#4f3831]">{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="jobs" className="section-compact bg-[var(--surface-soft)]">
          <div className="container-page">
            <SectionHeading eyebrow="Çalışma şekilleri" title="Yarı zamanlı ve tam zamanlı seçenekler" description="Programınıza en uygun esnek çalışma biçimini seçin." />
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <Card title="Yarı zamanlı">
                <ul className="space-y-2.5 text-sm leading-relaxed text-[#735f58]">
                  <li>Görevin türüne ve tamamlanmasına bağlı olarak yaklaşık <strong>200–1500 TL günlük</strong> kazanç fırsatı</li>
                  <li>Görev tamamlandıktan sonra günlük ödeme seçenekleri</li>
                  <li>Genellikle günde <strong>1–3 saat</strong> esnek çalışma</li>
                  <li>Online görevleri akıllı telefonunuzdan tamamlayabilirsiniz</li>
                  <li>Temel dijital beceriler avantaj sağlar</li>
                  <li>Evden esnek çalışma imkânı</li>
                </ul>
              </Card>
              <Card title="Tam zamanlı">
                <ul className="space-y-2.5 text-sm leading-relaxed text-[#735f58]">
                  <li>Görevin türüne ve tamamlanmasına bağlı olarak günlük <strong>3.000 TL ve üzeri</strong> kazanç fırsatı</li>
                  <li>Çalışma saatleri görev türüne göre değişebilir</li>
                  <li>Online görevler akıllı telefondan tamamlanabilir</li>
                  <li>Temel dijital beceriler avantaj sağlar</li>
                  <li>Evden çalışma esnekliği</li>
                </ul>
              </Card>
              <Card title="Esnek çalışma ve ek fırsatlar">
                <ul className="space-y-3 text-sm leading-relaxed text-[#735f58]">
                  <li><strong>Esnek katılım:</strong> zamanınıza ve uygunluğunuza göre mevcut görevleri seçin.</li>
                  <li><strong>Uzun vadeli fırsatlar:</strong> düzenli katılım yeni görev seçeneklerine erişim sağlayabilir.</li>
                  <li><strong>Ek fırsatlar:</strong> uygunluk ve mevcut programlara göre ek görevler sunulabilir.</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        <section className="section-compact">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-[#efc5af] bg-gradient-to-br from-[#fff0e8] via-[#fffaf7] to-[#fff4ee] p-6 shadow-xl shadow-orange-100/50 sm:p-7">
              <p className="text-sm font-semibold text-[var(--brand)]">Size uygun fırsatı bulun</p>
              <h3 className="mt-1 text-2xl font-bold text-[#3f2d28] sm:text-3xl">Evden çalışın</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#78655f] sm:text-base">Esnek fırsatlardan yararlanın, zamanınızı düzenleyin ve size uygun online görevleri tamamlayın.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat number="183,2+" label="BAŞVURU" />
                <Stat number="12.500+" label="GÖREV" />
                <Stat number="300+" label="EKİP" />
                <Stat number="4,81" label="MEMNUNİYET" />
              </div>
            </div>
          </div>
        </section>

        <section id="req" className="section-compact border-y border-[#f1ddd4] bg-[var(--surface-soft)]">
          <div className="container-page">
            <SectionHeading eyebrow="Şartlar" title="İhtiyacınız olanlar" description="Başlıca şartlar basit ve nettir." />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Req icon={<Smartphone className="h-5 w-5" />} text="Akıllı telefonunuzdan esnek online çalışma" />
              <Req icon={<Monitor className="h-5 w-5" />} text="Akıllı telefon ve internet erişimi" />
              <Req icon={<IdCard className="h-5 w-5" />} text="Adaylar en az 23 yaşında olmalıdır" />
              <Req icon={<Users className="h-5 w-5" />} text="Şartları karşılayan uygun adaylara yöneliktir" />
              <Req icon={<Lightbulb className="h-5 w-5" />} text="Temel dijital beceriler avantaj sağlar" />
            </div>
          </div>
        </section>

        <section id="why" className="section-compact">
          <div className="container-page grid gap-4 lg:grid-cols-3">
            {[
              { icon: <ShieldCheck className="h-5 w-5" />, title: "Düzenli başvuru süreci", desc: "Başvurunuzu göndermek ve doğrulamak için basit bir süreç." },
              { icon: <Rocket className="h-5 w-5" />, title: "Kolay başlangıç", desc: "Başvurudan sonra uygun adaylar mevcut fırsatlar hakkında daha fazla bilgi alır." },
              { icon: <Star className="h-5 w-5" />, title: "Esnek fırsatlar", desc: "Mevcut seçenekler uygunluğa, iş türüne ve müsaitliğe göre değişebilir." },
            ].map((feature) => (
              <div key={feature.title} className="card-like p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#fff0e8] text-[var(--brand)]">{feature.icon}</div>
                <p className="font-semibold text-white">{feature.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#78655f]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <FAQSection />

        <section className="border-t border-[#f3d3c4] bg-[#fff0e8] py-9 sm:py-10">
          <div className="container-page flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h3 className="m-0 text-2xl font-semibold text-[#3f2d28]">Başvurmaya hazır mısınız?</h3>
              <p className="mt-2 max-w-2xl text-sm text-[#735f58]">Formu doldurun. Başarılı gönderimden sonra başvurunuza Telegram üzerinden devam edebilirsiniz.</p>
            </div>
            <Link href="#apply" className="btn-primary whitespace-nowrap px-6">Hemen başvur</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#efd8cd] bg-[#fff4ee] py-8">
        <div className="container-page grid gap-7 text-sm text-[#8b766f] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand)] font-black text-[#ffffff]">HP</div>
            <p className="text-sm leading-relaxed text-[#8b766f]">HirePro, esnek uzaktan çalışma fırsatlarını keşfetmenize yardımcı olur.</p>
          </div>
          <Column title="Şirket" items={["Hakkımızda", "Kariyer", "Blog"]} />
          <Column title="Destek" items={["Yardım", "Güvenlik", "İletişim"]} />
          <Column title="Yasal" items={["Şartlar", "Gizlilik", "Çerezler"]} />
        </div>
        <div className="mt-6 text-center text-xs text-[#9a8178]">© {new Date().getFullYear()} HirePro, Inc. Tüm hakları saklıdır.</div>
      </footer>
    </div>
  );
}

function HeroPoint({ text }: { text: string }) {
  return <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[var(--brand)]" />{text}</span>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold text-[#3f2d28] sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[#7e6a63] sm:text-base">{description}</p></div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card-like p-5"><p className="mb-3 text-base font-bold text-[var(--brand)]">{title}</p>{children}</div>;
}

function Stat({ number, label }: { number: string; label: string }) {
  return <div className="rounded-xl border border-[#efd2c3] bg-white/80 p-3"><div className="text-xl font-semibold text-[#3f2d28] sm:text-2xl">{number}</div><div className="mt-1 text-[10px] tracking-widest text-[#8b766f]">{label}</div></div>;
}

function Req({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="card-like flex items-center gap-3 p-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff0e8] text-[var(--brand)]">{icon}</div><p className="text-sm leading-snug text-[#6f5a53]">{text}</p></div>;
}

function Column({ title, items }: { title: string; items: string[] }) {
  return <div><p className="mb-2 font-semibold text-[#4e3932]">{title}</p><ul className="space-y-1.5">{items.map((item) => <li key={item}><a className="footer-link" href="#">{item}</a></li>)}</ul></div>;
}

function FAQSection() {
  const items = [
    { q: "Kimler başvurabilir?", a: "23 yaş ve üzeri, akıllı telefonu ve internet erişimi olan uygun adaylar başvurabilir." },
    { q: "İş uzaktan mı?", a: "Evet. Uygun görevler sabit internet erişimi olan bir yerden online olarak yapılabilir." },
    { q: "Nasıl başvurabilirim?", a: "Formu doldurup gönderin. Başarılı gönderimden sonra Telegram üzerinden devam etmek için bir düğme görünür." },
    { q: "Başvurudan sonra ne olur?", a: "Bilgiler doğrulanır ve uygun adaylar mevcut fırsatlar hakkında daha fazla bilgi alır." },
    { q: "Çalışma saatleri ne kadar esnek?", a: "Saatler iş türüne, mevcut görevlere ve seçilen çalışma şekline göre değişir." },
  ];

  return (
    <section id="faq" className="section-compact border-t border-[#f1ddd4] bg-[var(--surface-soft)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading eyebrow="SSS" title="Sıkça sorulan sorular" description="Başvuru süreciyle ilgili temel soruların yanıtları." />
        <div className="mt-5 space-y-2.5">{items.map((item, index) => <FAQItem key={index} q={item.q} a={item.a} />)}</div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`overflow-hidden rounded-xl border bg-[var(--surface)] transition ${open ? "border-[#f2a97d]" : "border-[#f0d9cf]"}`}>
      <button type="button" className="flex w-full items-center justify-between gap-4 p-4 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="font-semibold text-[#4a342d]">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[var(--brand)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-[#efd8cd] px-4 pb-4 pt-3 text-sm leading-relaxed text-[#78655f]">{a}</div>}
    </div>
  );
}
