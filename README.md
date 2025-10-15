# Netlify Proxy Template

A minimal, production-friendly proxy layer for browser apps, deployed on Netlify Functions.

## ✨ Features

- CORS allowlist (`ALLOWED_ORIGINS`)
- Allowlist of forwarded headers (`FORWARD_HEADERS`)
- Preflight (OPTIONS) support, JSON/text/binary response handling


---

## 🚀 One-click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/simoncurd/my-netlify-proxy)


---

## ⚙️ Configuration

For development, place these in your .env.local file 

When deploying, set these in **Project Configuration → Environment variables** on Netlify:

| Variable | Required | Notes |
|---|---|---|
| `UPSTREAM_BASE` | Optional | Default is: `https://app.peopleforce.io`  |
| `ALLOWED_ORIGINS` | Recommended | Use this to define a comma-separated list of sites that will be allowed to use this function, or `*` in dev |
| `FORWARD_HEADERS` | Optional |  Incoming headers to pass upstream  such as `authorization,accept-language`. Default is `Accept` |
| `PEOPLEFORCE_API_KEY` | Required | Set your PeopleForce API key here |


---

## 🧪 Local development

```bash
npm i
npm run dev