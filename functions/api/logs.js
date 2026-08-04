export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    // Validación básica
    if (!body.date) throw new Error("Falta la fecha");

    // Lógica de Negocio: Calcular ganancias en el backend por seguridad
    // Tarifa: $0.10 por minuto (llamada + disponible)
    const tarifa = 0.10;
    const totalMinutos = (parseInt(body.call_minutes) || 0) + (parseInt(body.available_minutes) || 0);
    const gananciaEstimada = totalMinutos * tarifa;

    // UPSERT: Si existe la fecha actualiza, si no, inserta
    // Usamos tus columnas: work_logs (date, call_minutes, total_calls, available_minutes, earnings_estimated)
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
      body.call_minutes, 
      body.total_calls, 
      body.available_minutes,
      gananciaEstimada
    ).run();

    return new Response(JSON.stringify({ success: true, saved: info }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  try {
    let query = "SELECT * FROM work_logs ORDER BY date DESC LIMIT 50";
    let params = [];

    if (start && end) {
      query = "SELECT * FROM work_logs WHERE date >= ? AND date <= ? ORDER BY date ASC";
      params = [start, end];
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
