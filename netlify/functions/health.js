export async function handler() {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, ts: new Date().toISOString() })
    };
  }