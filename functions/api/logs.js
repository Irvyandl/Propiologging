// functions/api/logs.js

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { date, call_minutes, total_calls, available_minutes } = body;

    // Cálculo de seguridad para la columna earnings_estimated (Tarifa $0.10)
    const earnings = (Number(call_minutes) + Number(available_minutes)) * 0.10;

    // Lógica UPSERT manual: Intentamos actualizar, si no existe, insertamos.
    const update = await env.DB.prepare(`
      UPDATE work_logs 
      SET call_minutes = ?, total_calls = ?, available_minutes = ?, earnings_estimated = ?
      WHERE date = ?
    `).bind(call_minutes, total_calls, available_minutes, earnings, date).run();

    if (update.meta.changes === 0) {
      await env.DB.prepare(`
        INSERT INTO work_logs (date, call_minutes, total_calls, available_minutes, earnings_estimated)
        VALUES (?, ?, ?, ?, ?)
      `).bind(date, call_minutes, total_calls, available_minutes, earnings).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  // Consulta por rango de fechas
  const query = `
    SELECT * FROM work_logs 
    WHERE date >= ? AND date <= ? 
    ORDER BY date DESC
  `;
  
  const { results } = await env.DB.prepare(query).bind(start, end).all();
  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
}
