export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const body = await request.json();

    const message = {
      received: true,
      receivedData: body,
      databaseConnected: !!env.DB
    };

    return new Response(JSON.stringify(message), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
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