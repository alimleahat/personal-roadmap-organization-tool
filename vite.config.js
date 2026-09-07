import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Mirrors api/data.js so `npm run dev` and the deployed app behave identically.
// Both routes go through lib/store.js, so pointing dev at the same GitHub repo
// keeps your laptop and your phone on one set of data.
function dataApiPlugin() {
  return {
    name: "data-api",
    configureServer(server) {
      server.middlewares.use("/api/data", async (req, res) => {
        const { readData, writeData, usingGitHub, diagnostics } = await import("./lib/store.js");
        const { authorize } = await import("./lib/auth.js");

        const send = (status, body) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store, max-age=0");
          res.end(JSON.stringify(body));
        };

        const auth = authorize(req);
        if (!auth.ok) return send(auth.status, { error: auth.message });

        // Passcode-only check; never touches the store. Mirrors api/data.js.
        if (req.url && req.url.includes("check")) {
          return send(200, { ok: true });
        }
        if (req.url && req.url.includes("diag")) {
          return send(200, await diagnostics());
        }

        try {
          if (req.method === "GET") {
            return send(200, (await readData()) ?? {});
          }

          if (req.method === "POST") {
            let raw = "";
            for await (const chunk of req) raw += chunk;
            const body = JSON.parse(raw);

            if (!body || !Array.isArray(body.items)) {
              return send(400, { error: "Expected a payload with an items array" });
            }

            const result = await writeData(body);
            return send(200, { ok: true, commit: result.commit, backend: usingGitHub() ? "github" : "file" });
          }

          return send(405, { error: "Method not allowed" });
        } catch (err) {
          server.config.logger.error(`[api/data] ${err.message}`);
          return send(500, {
            error: err.message,
            hint: "The passcode was accepted; this is a storage problem. Check GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO and GITHUB_BRANCH.",
          });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Expose .env values to the dev middleware, which runs in Node and so does
  // not see import.meta.env.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [
      react(),
      dataApiPlugin(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "Roadmap",
          short_name: "Roadmap",
          description: "Personal roadmap board",
          theme_color: "#0F0F0F",
          background_color: "#0F0F0F",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          // The app shell is cached so it opens offline, but roadmap data is
          // never served from the service worker — stale items would be worse
          // than none. Offline reads come from the localStorage cache instead.
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /\/api\/data/,
              handler: "NetworkOnly",
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: {
      port: Number(process.env.PORT) || 5173,
      host: true,
    },
  };
});
