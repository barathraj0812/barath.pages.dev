export async function onRequest(context) {
  try {
    const result = await context.env.DB
      .prepare("SELECT 1 AS test")
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        message: "D1 connection successful",
        database: result
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "D1 connection failed",
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
