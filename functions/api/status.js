export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Leer historial de estados y breaks (GET /api/status)
export async function onRequestGet(context) {
  const { env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        date_only TEXT NOT NULL
      )
    `).run();

    const { results } = await env.DB.prepare(
      "SELECT id, status, timestamp, date_only FROM status_logs ORDER BY timestamp ASC"
    ).all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// Guardar nuevo cambio de estado o break (POST /api/status)
export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { status, timestamp } = body;

    if (!status || !timestamp) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios: status y timestamp" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const date_only = timestamp.split("T")[0].split(" ")[0];

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        date_only TEXT NOT NULL
      )
    `).run();

    const info = await env.DB.prepare(
      "INSERT INTO status_logs (status, timestamp, date_only) VALUES (?, ?, ?)"
    )
      .bind(status, timestamp, date_only)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        id: info.meta.last_row_id,
        status,
        timestamp,
        date_only,
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
