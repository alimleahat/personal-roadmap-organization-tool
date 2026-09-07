// Vercel serverless function backing the roadmap in production.
//
// GET  /api/data  -> current roadmap
// POST /api/data  -> replace roadmap (commits to GitHub)
//
// Both require the passcode header; see lib/auth.js.

import { readData, writeData, usingGitHub, diagnostics } from "../lib/store.js";
import { authorize } from "../lib/auth.js";

export default async function handler(req, res) {
  const auth = authorize(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.message });
  }

  // Roadmap data must never be served from a CDN edge cache.
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Passcode-only check. Deliberately does NOT touch GitHub, so a storage
  // misconfiguration can never be reported to the user as a wrong passcode.
  if (req.query?.check !== undefined) {
    return res.status(200).json({ ok: true });
  }

  // Configuration report. Behind the passcode, and reports presence only.
  if (req.query?.diag !== undefined) {
    return res.status(200).json(await diagnostics());
  }

  try {
    if (req.method === "GET") {
      const data = await readData();
      return res.status(200).json(data ?? {});
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      // Refuse to overwrite good data with something that isn't a roadmap.
      if (!body || !Array.isArray(body.items)) {
        return res.status(400).json({ error: "Expected a payload with an items array" });
      }

      const result = await writeData(body);
      return res.status(200).json({ ok: true, commit: result.commit, backend: usingGitHub() ? "github" : "file" });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[api/data]", err);
    return res.status(500).json({
      error: err.message,
      hint: "The passcode was accepted; this is a storage problem. Check GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO and GITHUB_BRANCH.",
    });
  }
}
