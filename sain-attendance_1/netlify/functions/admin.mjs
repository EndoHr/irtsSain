// Admin endpoints. Every request needs the header  x-admin-password: <ADMIN_PASSWORD>
// (ADMIN_PASSWORD is set in Netlify: Site configuration -> Environment variables).
//   POST   /api/admin                 -> { ok: true }   (password check only)
//   PUT    /api/admin?m=YYYY-MM       body: { "<id>": { n, d: [...] }, ... }  -> saves/replaces the month
//   DELETE /api/admin?m=YYYY-MM       -> removes the month
import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const MONTH_RE = /^\d{4}-\d{2}$/;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function passwordOk(given) {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real || !given) return false;
  const a = Buffer.from(String(given)), b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validMonthData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const ids = Object.keys(data);
  if (!ids.length) return false;
  return ids.every((id) => {
    const e = data[id];
    return /^\d{1,12}$/.test(id) && e && typeof e.n === "string" && Array.isArray(e.d) &&
      e.d.every((row) => Array.isArray(row) && row.length === 8 && row.every((v) => Number.isFinite(v)));
  });
}

export default async (req) => {
  if (!passwordOk(req.headers.get("x-admin-password"))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: "unauthorized" }, 401);
  }
  const url = new URL(req.url);
  const store = getStore({ name: "attendance", consistency: "strong" });
  const m = url.searchParams.get("m") || "";

  if (req.method === "POST") return json({ ok: true });

  if (!MONTH_RE.test(m)) return json({ error: "bad_month" }, 400);

  if (req.method === "PUT") {
    let data;
    try { data = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
    if (!validMonthData(data)) return json({ error: "bad_data" }, 400);
    await store.setJSON(m, data);
    return json({ ok: true, month: m, employees: Object.keys(data).length });
  }

  if (req.method === "DELETE") {
    await store.delete(m);
    return json({ ok: true, month: m });
  }

  return json({ error: "method_not_allowed" }, 405);
};

export const config = { path: "/api/admin" };
