# Netlify Proxy Template

A minimal, production-friendly proxy layer for browser apps, deployed on Netlify Functions.

## ✨ Features

- CORS allowlist (`ALLOWED_ORIGINS`)
- Upstream restriction (`UPSTREAM_BASE`)
- Optional server-side auth injection (`FORWARD_AUTH_HEADER`/`FORWARD_AUTH_VALUE`)
- Whitelist of forwarded headers (`FORWARD_HEADERS`)
- Preflight (OPTIONS) support, JSON/text/binary response handling


---

## 🚀 One-click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/simoncurd/my-netlify-proxy)


---

## ⚙️ Environment variables


For development, place these in your netlify.toml file in the build.environment section

Set these in **Site settings → Environment variables** on Netlify:

| Variable | Required | Example | Notes |
|---|---|---|---|
| `UPSTREAM_BASE` | ✅ (unless `REQUIRE_UPSTREAM=false`) | `https://api.example.com/v1` | Base URL your frontend should call via `/api/...` |
| `ALLOWED_ORIGINS` | Recommended | `https://app.example.com,https://localhost:5173` | Use `*` for dev; prefer explicit origins in prod |
| `FORWARD_HEADERS` | Optional | `authorization,accept-language` | Incoming headers to pass upstream |
| `FORWARD_AUTH_HEADER` | Optional | `Authorization` | Name of header to inject from server-side secret |
| `FORWARD_AUTH_VALUE` | Optional | `Bearer ***` | Value paired with `FORWARD_AUTH_HEADER` |
| `FETCH_TIMEOUT_MS` | Optional | `10000` | Upstream timeout in ms |


---

## 🧪 Local development

```bash
npm i
npm run dev