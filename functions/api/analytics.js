export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const body = await request.json();

    const now = new Date().toISOString();

    const visitorId = "test-visitor-001";

    await env.DB.prepare(`
      INSERT OR IGNORE INTO visitors
      (visitor_id, first_seen, last_seen)
      VALUES (?, ?, ?)
    `)
      .bind(visitorId, now, now)
      .run();

    return new Response(
      JSON.stringify({
        received: true,
        savedToDatabase: true,
        visitorId: visitorId,
        databaseConnected: !!env.DB
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        received: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}