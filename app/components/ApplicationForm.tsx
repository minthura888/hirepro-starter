"use client";

import React, { useEffect, useState } from "react";

type LeadData = {
  name: string;
  email: string;
  countryIso: string;
  dial: string;
  phone: string;
  phoneE164: string;
  gender: "male" | "female";
  age: number | "";
  note?: string | null;
  ip?: string | null; // <-- add ip captured from browser
};

export default function ApplicationForm() {
  const [formData, setFormData] = useState<LeadData>({
    name: "",
    email: "",
    countryIso: "in",
    dial: "+91",
    phone: "",
    phoneE164: "",
    gender: "male",
    age: "",
    note: null,
    ip: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // -------- Capture the real visitor IP in the browser --------
  useEffect(() => {
    let cancelled = false;

    async function fetchIp() {
      try {
        // Small timeout guard so UI never hangs if a network plugin blocks it
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 3500);

        // You can swap ipify for another similar service if you prefer.
        const res = await fetch("https://api.ipify.org?format=json", {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(t);

        if (!res.ok) throw new Error("ipify failed");
        const data = (await res.json()) as { ip?: string };
        if (!cancelled && data?.ip) {
          setFormData((s) => ({ ...s, ip: data.ip }));
        }
      } catch {
        // Don’t block submit if we can’t get IP — backend will still try to infer it.
        if (!cancelled) setFormData((s) => ({ ...s, ip: null }));
      }
    }

    fetchIp();
    return () => {
      cancelled = true;
    };
  }, []);
  // ------------------------------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      setSuccess(true);

      // Optionally open Telegram deep link here if you do that in your flow.
      // window.open(`https://t.me/your_bot?start=${json.workCode}`, "_blank");
    } catch (err: any) {
      console.error("Submit failed:", err);
      setError(err?.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <input
        type="text"
        name="name"
        placeholder="Your name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Your email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="phone"
        placeholder="Your Telegram number"
        value={formData.phone}
        onChange={handleChange}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Saved! Opening Telegram...</p>}
    </form>
  );
}
