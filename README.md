# Roadmap

A personal roadmap board you host yourself. Tracks, phases, drag-and-drop,
statuses, filters, undo/redo and a scratch pad — installable on a phone as a
web app, and it works offline.

Your data lives in a `data.json` in **your own private GitHub repo**, written
through the GitHub API. Every edit becomes a commit, so you get full version
history and can roll back to any point. No database to run, no third-party
service holding your notes.

## Why it's built this way

Most self-hosted boards need a database. This one doesn't, because a personal
roadmap is small and single-user — a JSON file is genuinely enough. Putting
that file in a git repo gets you durability, history and backups for free, and
means the storage bill is zero.

The trade-off: writes are one commit each, so they're debounced and there's no
multi-user conflict resolution. If two devices edit while one is offline, the
later sync wins. Fine for one person; not a team tool.

## Features

- Tracks and phases you define yourself, editable in the app
- Drag and drop items between tracks, and reorder within one
- Statuses (todo / in progress / done / blocked), due dates, notes
- Search and filter by phase, track and status
- Undo/redo, including keyboard shortcuts
- Scratch pad with its own categories
- Light and dark themes
- Installable as a phone app; opens and works offline, syncing when you return
- Passcode-gated so a public URL isn't a public roadmap

## Quick start

```
git clone https://github.com/YOUR-USERNAME/roadmap.git
cd roadmap
npm install
npm run dev
```

That runs against a local `data.json` file, with no GitHub or passcode needed.
Edit `src/config.js` to change the name in the header, and use **Settings** in
the app to set up your own tracks and phases.

## Deploying

You need two things: somewhere to host it, and a private repo to hold your data.

### 1. A private repo for your data

Create an empty **private** repo — for example `my-roadmap-data`. This is
where your roadmap gets committed.

> Do not use a public repo, and do not commit `data.json` into your fork of
> this project. Anything committed to a public repo stays in its history even
> after you delete it.

### 2. A GitHub token

Create a fine-grained token at
<https://github.com/settings/personal-access-tokens/new>:

- **Repository access:** Only select repositories → your data repo
- **Permissions:** Repository permissions → **Contents: Read and write**

> Fine-grained tokens default to *Public Repositories* only. Leave that default
> with a private data repo and the token will authenticate but not see the
> repo, giving a confusing 404. Select the repo explicitly.

### 3. Deploy

Import the repo at <https://vercel.com/new> — the Vite preset and the included
`vercel.json` handle the build. Then set these environment variables:

| Variable | Value |
|---|---|
| `GITHUB_TOKEN` | the token from step 2 |
| `GITHUB_OWNER` | your GitHub username |
| `GITHUB_REPO` | your data repo, e.g. `my-roadmap-data` |
| `GITHUB_BRANCH` | that repo's default branch (`main` or `master`) |
| `ROADMAP_PASSCODE` | a random string you choose |

**`ROADMAP_PASSCODE` is required in production.** A deployed URL is public;
without it, anyone who finds the URL can read and edit your roadmap.

Vercel only applies environment variables to *new* deployments, so redeploy
after adding them.

Any host that runs a Node serverless function works — the API is a single
handler in `api/data.js`.

### 4. Install on your phone

- **iOS (Safari):** Share → Add to Home Screen
- **Android (Chrome):** menu → Install app

## If something goes wrong

The app tells you rather than failing silently. If it can't load your data it
shows the reason and a **Check settings** button, which reports which of the
storage settings the server can actually see — presence and shape only, never
your token. It probes the token, then the repo, then the file, so the first
failure names the real culprit.

## How your data is protected

Losing a roadmap to a sync bug would be worse than any missing feature, so:

- **A failed load never overwrites good data.** With no successful load and no
  local cache, the app shows the sample content, disables editing and says why.
- **Saves require an actual edit.** Opening the page never triggers a write.
- **An empty server response is treated as an error** when the device holds a
  saved copy, rather than as a fresh start to overwrite.
- **Offline edits are queued to disk** and flushed on reconnect.
- **`npm run backup`** writes a timestamped copy into `backups/`.

## Configuration

| File | What it holds |
|---|---|
| `src/config.js` | the name and period in the header |
| `src/constants.js` | default tracks, phases and sample content |
| `.env.example` | every environment variable, documented |

## Tech

React 19, Vite 7, dnd-kit for drag and drop, vite-plugin-pwa for the installable
app. No backend beyond a single serverless function.

## License

MIT — see [LICENSE](LICENSE).
