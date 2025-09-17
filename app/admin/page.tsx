'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const ADMIN_KEY_PUBLIC = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

type Row = {
  id: number;
  name: string | null;
  email: string | null;
  phone_e164: string | null;
  gender: string | null;
  age: number | null;
  created_at: string;
};

export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [key, setKey] = useState(ADMIN_KEY_PUBLIC);
  const [loading, setLoading] = useState(false);

  async function load(limit = 20) {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/lead?limit=${limit}${key ? `&key=${encodeURIComponent(key)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'failed');
      setRows(data.rows || []);
      setCount(data.count || 0);
    } catch (e) {
      console.error(e);
      setRows([]); setCount(0);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(20); }, []);

  return (
    <div className="container-page py-10">
      <h1 className="mb-6">Admin · Recent Leads</h1>

      <div className="card-like p-4 mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Admin key"
          value={key}
          onChange={e => setKey(e.target.value)}
          className="h-10 w-80 rounded-xl border border-slate-300 px-3"
        />
        <button onClick={() => load(20)} className="btn-primary h-10">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <span className="text-sm text-slate-600">Total: {count}</span>
      </div>

      <div className="card-like overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Gender</th>
              <th className="text-left p-3">Age</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.id}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">{r.phone_e164}</td>
                <td className="p-3">{r.gender}</td>
                <td className="p-3">{r.age}</td>
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td className="p-4 text-slate-500" colSpan={7}>No rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
