import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../functions/api/analytics.js", import.meta.url),
  "utf8"
);
const { onRequestPost } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

const payload = {
  v: 1,
  visitorId: "5f1d7e3a-9b2c-4d61-8a73-6c4e2f0a1b5d",
  sessionId: "7a2c4e91-3d5f-4b68-9c20-1e7a3b5d9f42",
  event: "page_view",
  path: "/",
  referrer: null,
  data: {}
};

function request(body) {
  return new Request("https://barath.test/api/analytics", {
    method: "POST",
    headers: {
      Origin: "https://barath.test",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

test("rejects invalid payload before database access", async () => {
  const response = await onRequestPost({
    request: request({ ...payload, visitorId: "invalid" }),
    env: {}
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid analytics event" });
});

test("missing D1 binding fails with a generic response", async () => {
  const response = await onRequestPost({ request: request(payload), env: {} });
  const body = await response.text();

  assert.equal(response.status, 503);
  assert.equal(body, '{"error":"Analytics unavailable"}');
  assert.doesNotMatch(body, /stack|sql|secret|198\.51\.100/iu);
});

test("binds only the request IP to the session insert and never returns it", async () => {
  const statements = [];
  const DB = {
    prepare(query) {
      const statement = { query, values: [] };
      statement.bind = (...values) => {
        statement.values = values;
        statements.push(statement);
        return statement;
      };
      return statement;
    },
    async batch() {
      return [1, 1, 1].map((changes) => ({ meta: { changes } }));
    }
  };

  const incoming = request(payload);
  incoming.headers.set("CF-Connecting-IP", "198.51.100.42");
  const response = await onRequestPost({ request: incoming, env: { DB } });
  const sessionInsert = statements.find(({ query }) =>
    query.includes("INSERT INTO sessions")
  );
  const responseBody = await response.text();

  assert.equal(response.status, 200);
  assert.equal(sessionInsert.values[8], "198.51.100.42");
  assert.match(sessionInsert.query, /ip_address/iu);
  assert.doesNotMatch(responseBody, /198\.51\.100\.42/);
  assert.equal(responseBody, '{"received":true}');
});

test("uses SQL NULL when the Cloudflare IP header is absent or unusable", async () => {
  for (const header of [null, "not-an-ip"]) {
    const statements = [];
    const DB = {
      prepare(query) {
        const statement = { query, values: [] };
        statement.bind = (...values) => {
          statement.values = values;
          statements.push(statement);
          return statement;
        };
        return statement;
      },
      async batch() {
        return [1, 1, 1].map((changes) => ({ meta: { changes } }));
      }
    };
    const incoming = request(payload);
    if (header !== null) incoming.headers.set("CF-Connecting-IP", header);

    const response = await onRequestPost({ request: incoming, env: { DB } });
    const sessionInsert = statements.find(({ query }) =>
      query.includes("INSERT INTO sessions")
    );

    assert.equal(response.status, 200);
    assert.equal(sessionInsert.values[8], null);
  }
});

test("rejects a client-supplied IP field", async () => {
  const response = await onRequestPost({
    request: request({ ...payload, ip_address: "203.0.113.9" }),
    env: {}
  });

  assert.equal(response.status, 400);
});

test("rejects a client-provided consent claim", async () => {
  const response = await onRequestPost({
    request: request({ ...payload, consent: true }),
    env: {}
  });

  assert.equal(response.status, 400);
});
