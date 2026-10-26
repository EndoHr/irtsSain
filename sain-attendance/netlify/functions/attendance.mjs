// Public endpoints for employees.
//   GET /api/months                 -> ["2026-10", "2026-09", ...]
//   GET /api/attendance?m=YYYY-MM&id=14276 -> { n, d } for that one employee only
import { getStore } from "@netlify/blobs";

const MONTH_RE = /^\d{4}-\d{2}$/;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore({ name: "attendance", consistency: "strong" });

  if (url.pathname.endsWith("/months")) {
    const { blobs } = await store.list();
    return json(blobs.map((b) => b.key).filter((k) => MONTH_RE.test(k)).sort().reverse());
  }

  const m = url.searchParams.get("m") || "";
  const id = (url.searchParams.get("id") || "").trim();
  if (!MONTH_RE.test(m) || !/^\d{1,12}$/.test(id)) return json({ error: "bad_request" }, 400);

  const data = await store.get(m, { type: "json" });
  if (!data) return json({ error: "month_not_found" }, 404);
  const emp = data[id];
  if (!emp) return json({ error: "employee_not_found" }, 404);
  return json(emp);
};

export const config = { path: ["/api/months", "/api/attendance"] };
