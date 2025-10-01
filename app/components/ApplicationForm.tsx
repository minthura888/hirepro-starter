// app/components/ApplicationForm.tsx
"use client";

import { useState } from "react";

export default function ApplicationForm() {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      // Send form data to your API endpoint
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setStatus("success");

      // ✅ Fire Meta Pixel Lead event ONLY after success
      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "Lead", {
          email: formData.email, // optional: safe data to pass
        });
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        type="text"
        placeholder="Your Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="border p-2 w-full"
      />
      <input
        name="email"
        type="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={handleChange}
        required
        className="border p-2 w-full"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {status === "submitting" ? "Submitting..." : "Submit"}
      </button>

      {status === "success" && <p className="text-green-600">✅ Thanks! Your application was sent.</p>}
      {status === "error" && <p className="text-red-600">❌ Something went wrong. Try again.</p>}
    </form>
  );
}
