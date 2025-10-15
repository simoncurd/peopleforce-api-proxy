// A safe, configurable proxy for browser apps calling PeopleForce API.
// Features:
// - CORS allowlist via ALLOWED_ORIGINS
// - endpoint allowlist via ALLOWED_PATHS
// - Restrict outbound target with UPSTREAM_BASE (required by default)
// - Forward selected headers only (FORWARD_HEADERS)
// - API Key injection on server side (PEOPLEFORCE_API_KEY)
// - Handles preflight (OPTIONS), common methods, and JSON/text bodies
// - Basic binary passthrough for common types

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 10000);

export async function handler(event) {
  console.log("event path", event.path);
  try {

    const allowedPaths = ';' + process.env.ALLOWED_PATHS + ';' || ";;";

    if (allowedPaths.indexOf(';' + event.path + ';') == -1) {
        return withCors(event, {
            statusCode: 403,
            body: JSON.stringify({ error: "Path not allowed" })
        });
    }

    // Check origin restrictions first
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const requestOrigin = event.headers.origin || event.headers.Origin || "";
    
    // If ALLOWED_ORIGINS is set and not "*", check origin
    if (allowedOrigins.length > 0 && !allowedOrigins.includes("*")) {
        console.log('checking allowed origins')
      if (!allowedOrigins.includes(requestOrigin)) {

        console.log('request origin not permitted')
        return withCors(event, {
          statusCode: 403,
          body: JSON.stringify({ error: "Origin not allowed" })
        });
      }
      else {
        console.log('request origin match!');
      }
    }
    else {
        console.log('NOT checking allowed origins - not set')
    }

    if (!ALLOWED_METHODS.includes(event.httpMethod)) {
      return withCors(event, {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      });
    }

    // CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return preflight(event);
    }

    const upstreamBase = process.env.UPSTREAM_BASE || "https://app.peopleforce.io";
    const forwardAuthHeader = "X-API-Key";
    const forwardAuthValue = process.env.PEOPLEFORCE_API_KEY;   // e.g., "Bearer xyz"
    const forwardHeaders = (process.env.FORWARD_HEADERS || "Accept")
      .split(",")
      .map(h => h.trim())
      .filter(Boolean);

    const { path } = event;
    let targetUrl = "";

    if (!forwardAuthValue) {
        return withCors(event, {
            statusCode: 500,
            body: JSON.stringify({ error: "PEOPLEFORCE_API_KEY not set" })
        });
    }

    if (!upstreamBase) {
        return withCors(event, {
            statusCode: 500,
            body: JSON.stringify({ error: "UPSTREAM_BASE not set" })
        });
    }
    targetUrl = joinUrl(upstreamBase, path);
    //const qs = event.rawQuery ? `?${event.rawQuery}` : "";
    // Remove any accidental `url` param when using upstream mode
    // targetUrl = stripQueryParam(`${targetUrl}${qs}`, "url");


    // Build outgoing request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const outgoingHeaders = new Headers();
    // Whitelist selected incoming headers (case-insensitive)
    const incoming = event.headers || {};
    const incomingKeys = Object.keys(incoming);

    forwardHeaders.forEach((h) => {
      const match = incomingKeys.find(k => k.toLowerCase() === h.toLowerCase());
      if (match) outgoingHeaders.set(h, incoming[match]);
    });

    // Auth injection (server-side secret)
    outgoingHeaders.set(forwardAuthHeader, forwardAuthValue);
    
    // Pass content-type if present (helps upstream parse body)
    if (incoming["content-type"]) {
      outgoingHeaders.set("content-type", incoming["content-type"]);
    } else if (incoming["Content-Type"]) {
      outgoingHeaders.set("content-type", incoming["Content-Type"]);
    }

    // Identify requests as proxied
    outgoingHeaders.set("x-proxied-by", "netlify-proxy-template");

    // Body handling
    let body = undefined;
    if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
      body = event.isBase64Encoded ? Buffer.from(event.body || "", "base64") : event.body;
    }

    console.log("proxying to", targetUrl);
    const resp = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: outgoingHeaders,
      body,
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    // Copy selected response headers through
    const responseHeaders = Object.fromEntries([
      ...copyHeaderIfExists(resp.headers, "content-type"),
      ...copyHeaderIfExists(resp.headers, "cache-control"),
      ...copyHeaderIfExists(resp.headers, "expires"),
      ...copyHeaderIfExists(resp.headers, "etag")
    ]);

    // Handle body types
    const contentType = resp.headers.get("content-type") || "";
    let responseBody;
    let isBase64Encoded = false;

    if (/^application\/json\b/i.test(contentType)) {
      responseBody = await resp.text(); // already JSON string; preserve
    } else if (/^(text\/|application\/xml\b|application\/x-www-form-urlencoded\b)/i.test(contentType)) {
      responseBody = await resp.text();
    } else {
      // binary-ish
      const buf = Buffer.from(await resp.arrayBuffer());
      responseBody = buf.toString("base64");
      isBase64Encoded = true;
    }

    return withCors(event, {
      statusCode: resp.status,
      headers: responseHeaders,
      body: responseBody,
      isBase64Encoded
    });

  } catch (err) {
    const message = err.name === "AbortError" ? "Upstream timeout" : (err.message || "Proxy error");
    return withCors(event, {
      statusCode: 502,
      body: JSON.stringify({ error: message })
    });
  }
}

/** Helpers **/

function preflight(event) {
  // Allow requested headers (but you can also fix a list)
  const reqHeaders = event.headers["access-control-request-headers"] || event.headers["Access-Control-Request-Headers"] || "";
  const allowHeaders = reqHeaders || "authorization,content-type";

  return withCors(event, {
    statusCode: 204,
    headers: {
      "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
      "Access-Control-Allow-Headers": allowHeaders
    },
    body: ""
  });
}

function withCors(event, response) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const requestOrigin = event.headers.origin || event.headers.Origin || "";

  const headers = {
    ...(response.headers || {}),
  };

  if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (allowedOrigins.includes(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
    headers["Vary"] = mergeVary(headers["Vary"], "Origin");
  } else {
    // If not allowed, you could omit the ACAO header (default deny)
  }

  headers["Access-Control-Allow-Credentials"] = "false";

  return {
    ...response,
    headers
  };
}

function copyHeaderIfExists(hs, name) {
  const v = hs.get(name);
  return v ? [[name, v]] : [];
}

function joinUrl(base, path) {
  // Ensure exactly one slash between
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

function mergeVary(existing, add) {
  if (!existing) return add;
  const set = new Set(existing.split(",").map(s => s.trim()));
  set.add(add);
  return Array.from(set).join(", ");
}