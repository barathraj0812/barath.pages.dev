
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_EVENTS = new Set([
  "page_view",
  "section_view",
  "project_open",
  "print",
  "external_link",
  "contact_submit",
  "gallery_summary"
]);

const ALLOWED_SECTIONS = new Set([
  "about",
  "skills",
  "projects",
  "experience",
  "achievements",
  "contact"
]);

const ALLOWED_PROJECTS = new Set([
  "nutrigreen",
  "astrotamil",
  "solar-system",
  "ai-movie",
  "tneb"
]);

const ALLOWED_PRINT_SOURCES = new Set(["cv", "footer"]);
const ALLOWED_LINK_TARGETS = new Set([
  "github",
  "itch",
  "youtube",
  "other"
]);

const MAX_BODY_BYTES = 2048;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function validPath(value) {
  return (
    typeof value === "string" &&
    value.length <= 200 &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[?#\\\u0000-\u001f\u007f]/.test(value)
  );
}

function validData(event, data) {
  if (!isPlainObject(data)) return false;

  const keys = Object.keys(data);

  switch (event) {
    case "page_view":
    case "contact_submit":
      return keys.length === 0;

    case "section_view":
      return (
        keys.length === 1 &&
        ALLOWED_SECTIONS.has(data.section)
      );

    case "project_open":
      return (
        keys.length === 1 &&
        ALLOWED_PROJECTS.has(data.project)
      );

    case "print":
      return (
        keys.length === 1 &&
        ALLOWED_PRINT_SOURCES.has(data.source)
      );

    case "external_link":
      return (
        keys.length === 1 &&
        ALLOWED_LINK_TARGETS.has(data.target)
      );

    case "gallery_summary":
      return (
        keys.length === 3 &&
        ["screenshots", "zoom", "fullscreen"].every(
          (key) =>
            Number.isInteger(data[key]) &&
            data[key] >= 0 &&
            data[key] <= 999
        )
      );

    default:
      return false;
  }
}

function getReferrerHost(value, requestUrl) {
  if (typeof value !== "string" || value.length > 500) {
    return null;
  }

  try {
    const referrer = new URL(value);

    if (
      referrer.protocol !== "https:" &&
      referrer.protocol !== "http:"
    ) {
      return null;
    }

    if (referrer.origin === new URL(requestUrl).origin) {
      return null;
    }

    return referrer.hostname.toLowerCase().slice(0, 253);
  } catch {
    return null;
  }
}

function getClientIp(request) {
  const value = request.headers.get("CF-Connecting-IP")?.trim();

  if (!value || value.length > 45) {
    return null;
  }

  // Cloudflare supplies an IP literal here. Validate it before storage so an
  // absent or malformed header becomes SQL NULL rather than fabricated data.
  if (/^[0-9a-f:.]+$/i.test(value) && value.includes(":")) {
    try {
      const parsed = new URL(`http://[${value}]/`);
      if (parsed.hostname.startsWith("[") && parsed.hostname.endsWith("]")) {
        return value;
      }
    } catch {
      return null;
    }
    return null;
  }

  const octets = value.split(".");
  if (
    octets.length === 4 &&
    octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)
  ) {
    return value;
  }

  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");

  if (origin !== requestUrl.origin) {
    return json({ error: "Invalid origin" }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";

  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return json({ error: "Unsupported content type" }, 415);
  }

  const declaredLength = Number(
    request.headers.get("Content-Length")
  );

  if (
    request.headers.has("Content-Length") &&
    (!Number.isFinite(declaredLength) ||
      declaredLength < 0 ||
      declaredLength > MAX_BODY_BYTES)
  ) {
    return json({ error: "Request too large" }, 413);
  }

  let rawBody;

  try {
    rawBody = await request.text();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  if (
    new TextEncoder().encode(rawBody).byteLength >
    MAX_BODY_BYTES
  ) {
    return json({ error: "Request too large" }, 413);
  }

  let body;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const allowedBodyKeys = new Set([
    "v",
    "visitorId",
    "sessionId",
    "event",
    "path",
    "referrer",
    "data"
  ]);

  if (
    !isPlainObject(body) ||
    Object.keys(body).some((key) => !allowedBodyKeys.has(key)) ||
    body.v !== 1 ||
    !UUID_RE.test(body.visitorId || "") ||
    !UUID_RE.test(body.sessionId || "") ||
    !ALLOWED_EVENTS.has(body.event) ||
    !validPath(body.path) ||
    !validData(body.event, body.data) ||
    !(
      body.referrer === null ||
      typeof body.referrer === "string"
    )
  ) {
    return json({ error: "Invalid analytics event" }, 400);
  }

  if (
    !env?.DB ||
    typeof env.DB.prepare !== "function" ||
    typeof env.DB.batch !== "function"
  ) {
    return json({ error: "Analytics unavailable" }, 503);
  }

  const now = new Date().toISOString();
  const visitorId = body.visitorId.toLowerCase();
  const sessionId = body.sessionId.toLowerCase();
  const event = body.event;
  const path = body.path;
  const data = body.data;
  const referrerHost = getReferrerHost(
    body.referrer,
    request.url
  );

  const userAgent = request.headers.get("User-Agent") || "";

  const deviceClass =
    /tablet|ipad/i.test(userAgent)
      ? "tablet"
      : /mobile|android|iphone/i.test(userAgent)
        ? "mobile"
        : "desktop";

  const country =
    typeof request.cf?.country === "string" &&
    /^[A-Z]{2}$/.test(request.cf.country)
      ? request.cf.country
      : null;
  const ipAddress = getClientIp(request);

  try {
    const statements = [
      env.DB.prepare(`
        INSERT INTO visitors (visitor_id, first_seen, last_seen)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM sessions
          WHERE session_id = ? AND visitor_id != ?
        )
        ON CONFLICT(visitor_id) DO UPDATE SET
          last_seen = excluded.last_seen
      `).bind(visitorId, now, now, sessionId, visitorId),

      env.DB.prepare(`
        INSERT INTO sessions (
          visitor_id, session_id, started_at, last_activity,
          landing_page, country, referrer_host, device_class,
          ip_address
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM visitors WHERE visitor_id = ?
        )
        AND NOT EXISTS (
          SELECT 1 FROM sessions
          WHERE session_id = ? AND visitor_id != ?
        )
        ON CONFLICT(session_id) DO UPDATE SET
          last_activity = excluded.last_activity
        WHERE sessions.visitor_id = excluded.visitor_id
      `).bind(
        visitorId,
        sessionId,
        now,
        now,
        path,
        country,
        referrerHost,
        deviceClass,
        ipAddress,
        visitorId,
        sessionId,
        visitorId
      ),

      event === "page_view"
        ? env.DB.prepare(`
            INSERT INTO page_views (
              visitor_id, session_id, page_url, timestamp
            )
            SELECT ?, ?, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM sessions
              WHERE session_id = ? AND visitor_id = ?
            )
          `).bind(
            visitorId,
            sessionId,
            path,
            now,
            sessionId,
            visitorId
          )
        : env.DB.prepare(`
            INSERT INTO events (
              visitor_id, session_id, event_name,
              event_data, page_url, timestamp
            )
            SELECT ?, ?, ?, ?, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM sessions
              WHERE session_id = ? AND visitor_id = ?
            )
          `).bind(
            visitorId,
            sessionId,
            event,
            JSON.stringify(data),
            path,
            now,
            sessionId,
            visitorId
          )
    ];

    const results = await env.DB.batch(statements);

    if (results[1]?.meta?.changes !== 1) {
      return json({ error: "Invalid session" }, 409);
    }

    if (results[2]?.meta?.changes !== 1) {
      return json({ error: "Analytics unavailable" }, 503);
    }

    return json({ received: true }, 200);
  } catch {
    return json({ error: "Analytics unavailable" }, 503);
  }
}
