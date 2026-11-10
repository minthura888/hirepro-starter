"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { fbqTrack } from "@/lib/pixel";
import { ttqTrack } from "@/lib/tiktok";

const BOT_USERNAME =
  process.env.NEXT_PUBLIC_BOT_USERNAME || "applyyourjob_bot";

const COUNTRIES = [
  { iso: "tr", name: "Türkiye", dial: "+90", flag: "🇹🇷" },
  { iso: "de", name: "Almanya", dial: "+49", flag: "🇩🇪" },
  { iso: "pl", name: "Polonya", dial: "+48", flag: "🇵🇱" },
  { iso: "sy", name: "Suriye", dial: "+963", flag: "🇸🇾" },
  { iso: "in", name: "Hindistan", dial: "+91", flag: "🇮🇳" },
  { iso: "us", name: "ABD / Kanada", dial: "+1", flag: "🇺🇸" },
  { iso: "my", name: "Malezya", dial: "+60", flag: "🇲🇾" },
  { iso: "id", name: "Endonezya", dial: "+62", flag: "🇮🇩" },
  { iso: "ph", name: "Filipinler", dial: "+63", flag: "🇵🇭" },
  { iso: "vn", name: "Vietnam", dial: "+84", flag: "🇻🇳" },
  { iso: "th", name: "Tayland", dial: "+66", flag: "🇹🇭" },
  { iso: "mm", name: "Myanmar", dial: "+95", flag: "🇲🇲" },
  { iso: "bd", name: "Bangladeş", dial: "+880", flag: "🇧🇩" },
  { iso: "pk", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { iso: "np", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { iso: "lk", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { iso: "au", name: "Avustralya", dial: "+61", flag: "🇦🇺" },
  { iso: "za", name: "Güney Afrika", dial: "+27", flag: "🇿🇦" },
  { iso: "fr", name: "Fransa", dial: "+33", flag: "🇫🇷" },
  { iso: "gb", name: "Birleşik Krallık", dial: "+44", flag: "🇬🇧" },
  { iso: "ae", name: "Birleşik Arap Emirlikleri", dial: "+971", flag: "🇦🇪" },
  { iso: "sg", name: "Singapur", dial: "+65", flag: "🇸🇬" },
];

const isMobile = () =>
  /iPhone|iPad|iPod|Android/i.test(
    typeof navigator === "undefined" ? "" : navigator.userAgent
  );

const onlyDigits = (value: string) => value.replace(/\D+/g, "");

const normalizeLocalPhone = (dial: string, value: string) => {
  const countryCode = onlyDigits(dial);
  let localNumber = onlyDigits(value);

  while (localNumber.startsWith("00")) localNumber = localNumber.slice(2);
  if (
    countryCode &&
    localNumber.startsWith(countryCode) &&
    localNumber.length > countryCode.length
  ) {
    localNumber = localNumber.slice(countryCode.length);
  }
  localNumber = localNumber.replace(/^0+/, "");
  return localNumber;
};

type LeadApiResponse = {
  ok?: boolean;
  id?: number;
  workCode?: string;
  work_code?: string;
  phone_e164?: string;
  isNew?: boolean;
  error?: string;
};

export default function ApplicationForm() {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedIsNew, setSubmittedIsNew] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);
  const [submittedPhoneE164, setSubmittedPhoneE164] = useState("");
  const [conversionSent, setConversionSent] = useState(false);

  const phoneLocalNumber = useMemo(
    () => normalizeLocalPhone(selectedCountry.dial, phone),
    [selectedCountry, phone]
  );

  const phoneE164 = useMemo(() => {
    const countryCode = onlyDigits(selectedCountry.dial);
    return countryCode && phoneLocalNumber
      ? `+${countryCode}${phoneLocalNumber}`
      : "";
  }, [selectedCountry, phoneLocalNumber]);

  const openTelegram = () => {
    const tgWeb = `https://t.me/${BOT_USERNAME}`;
    const tgApp = `tg://resolve?domain=${BOT_USERNAME}`;
    const tgIntent = `intent://resolve?domain=${BOT_USERNAME}#Intent;scheme=tg;package=org.telegram.messenger;end`;

    if (isMobile()) {
      location.href = tgApp;
      setTimeout(() => {
        if (document.visibilityState === "hidden") return;
        const onAndroid = /Android/i.test(navigator.userAgent);
        if (onAndroid) {
          location.href = tgIntent;
          setTimeout(() => {
            if (document.visibilityState === "hidden") return;
            location.href = tgWeb;
          }, 450);
        } else {
          location.href = tgWeb;
        }
      }, 650);
    } else {
      window.open(tgWeb, "_blank", "noopener,noreferrer");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || submitted) return;

    setError(null);
    const ageNum = Number(age || "0");

    if (!name.trim()) return setError("Lütfen adınızı girin.");
    if (!phoneE164)
      return setError("Lütfen Telegram'da kullandığınız telefon numarasını girin.");
    if (!ageNum || ageNum < 23 || ageNum > 99)
      return setError("Lütfen geçerli bir yaş girin. Yaş aralığı 23–99 olmalıdır.");

    const payload = {
      name: name.trim(),
      email: "",
      countryIso: selectedCountry.iso,
      dial: selectedCountry.dial,
      phone: phoneLocalNumber,
      phoneE164,
      gender,
      age: ageNum,
      note: null as string | null,
    };

    setSaving(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as LeadApiResponse | null;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Başvuru kaydedilemedi.");
      }

      setSubmittedIsNew(data.isNew === true);
      setSubmittedLeadId(typeof data.id === "number" ? data.id : null);
      setSubmittedPhoneE164(data.phone_e164 || phoneE164);
      setSubmitted(true);
      setSaving(false);
    } catch {
      setSaving(false);
      setError("Başvurunuz kaydedilemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleTelegramContinue = async () => {
    setError(null);

    if (!conversionSent) {
      const eventId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `telegram-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (submittedLeadId && submittedPhoneE164) {
        try {
          await fetch("/api/lead/continue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId,
              leadId: submittedLeadId,
              phoneE164: submittedPhoneE164,
              isNew: submittedIsNew,
            }),
            keepalive: true,
          });
        } catch {}
      }
      try {
        fbqTrack("Lead", { action: "telegram_continue" });
        ttqTrack("SubmitForm", { action: "telegram_continue" });
      } catch {}

      if (submittedIsNew) {
        try {
          fbqTrack("CompleteRegistration", {
            action: "unique_phone_telegram_continue",
          });
          ttqTrack("CompleteRegistration", {
            action: "unique_phone_telegram_continue",
          });
        } catch {}
      }
      setConversionSent(true);
    }

    if (isMobile()) window.setTimeout(openTelegram, 180);
    else openTelegram();
  };

  const fieldClass =
    "mt-1.5 w-full h-11 rounded-xl border border-[#e8cfc3] bg-white px-3 text-[#3f2d28] placeholder:text-[#b29b91] shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12";

  return (
    <form id="apply" onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl scroll-mt-20">
      <div className="rounded-2xl border border-[#ecd8cf] bg-white p-4 shadow-xl shadow-orange-100/50 sm:p-6">
        <div className="mb-4 rounded-xl border border-[#f0c8b4] bg-[#fff2eb] px-3.5 py-2.5 text-xs leading-relaxed text-[#8a5c48] sm:px-4 sm:py-3 sm:text-sm">
          İşe alım ekibimiz seçilen adaylarla Telegram üzerinden iletişim kurar. Telegram hesabınıza bağlı bir telefon numarası kullanın.
        </div>

        <label className="block text-sm font-semibold text-[#4d3730]">* Ad Soyad</label>
        <input type="text" placeholder="Adınızı girin" value={name} disabled={submitted} onChange={(e) => setName(e.target.value)} className={fieldClass} />

        <label className="mt-4 block text-sm font-semibold text-[#4d3730]">* Telegram telefon numarası</label>
        <div className="mt-1.5 grid grid-cols-[0.95fr_1.05fr] gap-2 sm:grid-cols-10 sm:gap-3">
          <select
            value={selectedCountry.iso}
            disabled={submitted}
            onChange={(e) => setSelectedCountry(COUNTRIES.find((country) => country.iso === e.target.value) || COUNTRIES[0])}
            className="h-11 min-w-0 rounded-xl border border-[#e8cfc3] bg-white px-2.5 text-sm text-[#3f2d28] shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-4 sm:h-12 sm:px-3"
          >
            {COUNTRIES.map((country) => (
              <option key={country.iso} value={country.iso}>{country.flag} {country.name} · {country.dial}</option>
            ))}
          </select>
          <input type="tel" inputMode="numeric" placeholder="Telefon numaranızı girin" value={phone} disabled={submitted} onChange={(e) => setPhone(e.target.value)} className="h-11 min-w-0 rounded-xl border border-[#e8cfc3] bg-white px-2.5 text-sm text-[#3f2d28] placeholder:text-[#b29b91] shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-6 sm:h-12 sm:px-3" />
        </div>
        <p className="mt-1.5 text-[11px] text-[#8a756e] sm:text-xs">
          Bu numara Telegram doğrulaması için kullanılacaktır:&nbsp;
          <strong className="text-[#5a4038]">{phoneE164 || "—"}</strong>
        </p>

        <label className="mt-4 block text-sm font-semibold text-[#4d3730]">* Cinsiyet</label>
        <div className="mt-2 flex flex-wrap items-center gap-5 text-sm text-[#60473f]">
          <label className="inline-flex items-center gap-2"><input type="radio" name="gender" checked={gender === "male"} disabled={submitted} onChange={() => setGender("male")} className="accent-[#f97316]" /><span>Erkek</span></label>
          <label className="inline-flex items-center gap-2"><input type="radio" name="gender" checked={gender === "female"} disabled={submitted} onChange={() => setGender("female")} className="accent-[#f97316]" /><span>Kadın</span></label>
        </div>

        <label className="mt-4 block text-sm font-semibold text-[#4d3730]">* Yaş</label>
        <input type="number" min={23} max={99} placeholder="Yaşınızı girin" value={age} disabled={submitted} onChange={(e) => setAge(e.target.value)} className={fieldClass} />

        {!submitted && (
          <div className="mt-5 flex justify-center">
            <button type="submit" disabled={saving} className="btn-primary min-w-[220px] disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Kaydediliyor…" : "Başvuruyu gönder"}
            </button>
          </div>
        )}

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {submitted && (
          <div id="apply-status" className="mt-5 rounded-2xl border border-[#f0c6b0] bg-[#fff3ec] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
              <div>
                <h3 className="m-0 text-base font-semibold text-[#3f2d28]">Başvurunuz başarıyla gönderildi</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#76645e]">
                  Bilgileriniz kaydedildi. Başvurunuza devam etmek için aşağıdaki düğmeyle Telegram'ı açın. Cihazınızda Telegram'ın yüklü olduğundan emin olun.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={handleTelegramContinue} className="btn-primary min-w-[250px] gap-2">
                <Send className="h-4 w-4" /> Telegram'da devam et
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-[#8a756e]">Telegram yalnızca bu düğmeye bastığınızda açılır.</p>
          </div>
        )}
      </div>
    </form>
  );
}
