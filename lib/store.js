// Single source of truth for roadmap data.
//
// Primary backend is a data.json committed to a private GitHub repo, so every
// save becomes a versioned commit and nothing is ever silently lost. When no
// GitHub credentials are configured we fall back to the local file, which keeps
// `npm run dev` working offline exactly as it always has.

import fs from "fs";
import path from "path";

// Read lazily rather than at import time: Vite loads .env after module
// imports are hoisted, so anything captured up here would always be undefined.
function config() {
  return {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || "master",
    token: process.env.GITHUB_TOKEN,
    file: process.env.DATA_PATH || "data.json",
  };
}

export function usingGitHub() {
  const { token, owner, repo } = config();
  return Boolean(token && owner && repo);
}

const localFile = path.resolve(process.cwd(), "data.json");

// The blob sha GitHub needs to accept an update. Cached so a normal save costs
// one request instead of two; refreshed automatically whenever it goes stale.
let cachedSha = null;

function ghUrl() {
  const { owner, repo, file } = config();
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(file)}`;
}

function ghHeaders() {
  return {
    Authorization: `Bearer ${config().token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "roadmap-app",
  };
}

async function ghRead() {
  const res = await fetch(`${ghUrl()}?ref=${encodeURIComponent(config().branch)}`, {
    headers: ghHeaders(),
    cache: "no-store",
  });

  if (res.status === 404) {
    cachedSha = null;
    return null;
  }
  if (!res.ok) {
    throw new Error(`GitHub read failed (${res.status}): ${await res.text()}`);
  }

  const body = await res.json();
  cachedSha = body.sha;
  return JSON.parse(Buffer.from(body.content, "base64").toString("utf-8"));
}

async function ghWrite(data, { retrying = false } = {}) {
  if (cachedSha === null && !retrying) {
    // No sha in hand: find out whether the file already exists.
    await ghRead().catch(() => null);
  }

  const payload = {
    message: `Update roadmap (${new Date().toISOString()})`,
    content: Buffer.from(JSON.stringify(data, null, 2), "utf-8").toString("base64"),
    branch: config().branch,
  };
  if (cachedSha) payload.sha = cachedSha;

  const res = await fetch(ghUrl(), {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // A stale sha means someone (another device, or you on github.com) wrote
  // first. Re-read to pick up the current sha and apply this write on top.
  if ((res.status === 409 || res.status === 422) && !retrying) {
    await ghRead().catch(() => null);
    return ghWrite(data, { retrying: true });
  }

  if (!res.ok) {
    throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
  }

  const body = await res.json();
  cachedSha = body.content?.sha ?? null;
  return { ok: true, commit: body.commit?.sha ?? null };
}

function localRead() {
  if (!fs.existsSync(localFile)) return null;
  return JSON.parse(fs.readFileSync(localFile, "utf-8"));
}

function localWrite(data) {
  // Write to a temp file and rename, so a crash mid-write can never leave a
  // truncated data.json behind.
  const tmp = `${localFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, localFile);
  return { ok: true, commit: null };
}

export async function readData() {
  return usingGitHub() ? ghRead() : localRead();
}

export async function writeData(data) {
  return usingGitHub() ? ghWrite(data) : localWrite(data);
}

/**
 * Report what the server can see about its own storage configuration.
 * Presence and shape only — never the token itself — so this is safe to
 * return to the browser. Also probes GitHub so a bad token, a wrong repo
 * name and a wrong branch are told apart.
 */
export async function diagnostics() {
  const { owner, repo, branch, token, file } = config();

  const out = {
    backend: usingGitHub() ? "github" : "local file",
    env: {
      GITHUB_TOKEN: token ? `set (${token.length} chars, starts "${token.slice(0, 4)}")` : "MISSING",
      GITHUB_OWNER: owner || "MISSING",
      GITHUB_REPO: repo || "MISSING",
      GITHUB_BRANCH: branch,
      DATA_PATH: file,
    },
  };

  if (!usingGitHub()) {
    out.problem = "GitHub is not configured, so the app is trying to read a local file. On a serverless host that file does not exist. Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO, then redeploy.";
    return out;
  }

  // Probe in order, so the first failure names the actual culprit.
  try {
    const who = await fetch("https://api.github.com/user", { headers: ghHeaders() });
    out.tokenValid = who.ok;
    if (!who.ok) {
      out.problem = `GITHUB_TOKEN is not valid (GitHub said ${who.status}). Regenerate it and redeploy.`;
      return out;
    }

    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders() });
    out.repoReachable = repoRes.ok;
    if (!repoRes.ok) {
      out.problem = `Cannot see ${owner}/${repo} (GitHub said ${repoRes.status}). Check GITHUB_OWNER and GITHUB_REPO, and that the token grants access to this repo.`;
      return out;
    }
    out.defaultBranch = (await repoRes.json()).default_branch;

    const fileRes = await fetch(`${ghUrl()}?ref=${encodeURIComponent(branch)}`, { headers: ghHeaders() });
    out.fileFound = fileRes.ok;
    if (!fileRes.ok) {
      out.problem = `Token and repo are fine, but ${file} was not found on branch "${branch}" (GitHub said ${fileRes.status}). The repo's default branch is "${out.defaultBranch}" — set GITHUB_BRANCH to that.`;
      return out;
    }

    out.problem = null;
    out.ok = true;
  } catch (err) {
    out.problem = `Could not reach GitHub at all: ${err.message}`;
  }

  return out;
}
