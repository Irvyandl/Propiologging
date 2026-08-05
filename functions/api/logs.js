export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    if (!body.date) throw new Error("Falta la fecha");

    const callMinutes = parseInt(body.call_minutes) || 0;
    const totalCalls = parseInt(body.total_calls) || 0;
    const availableMinutes = parseInt(body.available_minutes) || 0;

    // REGLA DE NEGOCIO CORREGIDA: Solo se paga por minutos en llamada
    const tarifa = 0.10;
    const gananciaEstimada = callMinutes * tarifa;

    const info = await env.DB.prepare(`
      INSERT INTO work_logs (date, call_minutes, total_calls, available_minutes, earnings_estimated)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        call_minutes = excluded.call_minutes,
        total_calls = excluded.total_calls,
        available_minutes = excluded.available_minutes,
        earnings_estimated = excluded.earnings_estimated
    `).bind(
      body.date,
      callMinutes,
      totalCalls,
      availableMinutes,
      gananciaEstimada
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      earnings_estimated: gananciaEstimada 
    }), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e) {
    console.error("Error en POST /api/logs:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  try {
    let query = "SELECT * FROM work_logs ORDER BY date DESC LIMIT 100";
    let params = [];

    if (start && end) {
      query = "SELECT * FROM work_logs WHERE date >= ? AND date <= ? ORDER BY date ASC";
      params = [start, end];
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify(results || []), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e) {
    console.error("Error en GET /api/logs:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
