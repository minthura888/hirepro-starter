// app/components/ApplicationForm.tsx
"use client";

import { useState } from "react";

export default function ApplicationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      // Send to your API – change this path if you use a different endpoint
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setStatus("success");

      // Fire Meta Pixel "Lead" ONLY after a successful submit
      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "Lead", { email });
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <section id="apply" className="bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="p-6 md:p-8 rounded-2xl border border-slate-200 bg-white/70 shadow-sm">
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              Recruiters will contact applicants via Telegram. Please enter the phone number used on Telegram.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="btn-primary px-5 py-2 rounded-xl"
              >
                {status === "submitting" ? "Submitting..." : "Submit"}
              </button>
            </div>

            {status === "success" && (
              <p className="mt-3 text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                ✅ Thanks! Your application was sent.
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                ❌ Something went wrong. Try again.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
