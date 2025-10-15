# PeopleForce Proxy Template

A proxy application for PeopleForce that can be easily deployed on Netlify.

## ✨ Features

- Restrict callers to specific origins with the (`ALLOWED_ORIGINS`) parameter
- Specify headers to by forwarded (`FORWARD_HEADERS`)
- Preflight (OPTIONS) support, JSON/text/binary response handling

---

## 🚀 One-click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/simoncurd/my-netlify-proxy)


---

## ⚙️ Configuration

For development, place these in your .env.local file 

When deploying to Netlify, set these in **Project Configuration → Environment variables**:

| Variable | Required | Notes |
|---|---|---|
| `PEOPLEFORCE_API_KEY` | Required | Set your PeopleForce API key here |
| `ALLOWED_PATHS` | Required | Use this to define the list of API paths that the proxy supports. Semi-colon separated i.e. `/api/public/v3/recruitment/vacancies;/api/public/v3/departments;/api/public/v3/locations;/api/public/v3/employment_types` |
| `ALLOWED_ORIGINS` | Recommended | Use this to define a comma-separated list of sites that will be allowed to use this function, or `*` in dev |
| `UPSTREAM_BASE` | Optional | Default is: `https://app.peopleforce.io`  |
| `FORWARD_HEADERS` | Optional |  Incoming headers to pass upstream  such as `authorization,accept-language`. Default is `Accept` |

---

## 🧪 Local development

```bash
npm i
npm run dev