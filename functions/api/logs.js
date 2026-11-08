// Archivo: functions/api/logs.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    
    const callMinutes = parseFloat(body.call_minutes) || 0;
    const totalCalls = parseInt(body.total_calls) || 0;
    const availableMinutes = parseFloat(body.available_minutes) || 0;
    const gananciaEstimada = parseFloat(body.earnings_estimated) || (callMinutes * 0.10);

    const info = await env.DB.prepare(
      `INSERT INTO work_logs (date, call_minutes, total_calls, available_minutes, earnings_estimated) 
       VALUES (?, ?, ?, ?, ?) 
       ON CONFLICT(date) DO UPDATE SET 
       call_minutes = excluded.call_minutes, 
       total_calls = excluded.total_calls, 
       available_minutes = excluded.available_minutes, 
       earnings_estimated = excluded.earnings_estimated`
    ).bind(body.date, callMinutes, totalCalls, availableMinutes, gananciaEstimada).run();

    return new Response(JSON.stringify({ success: true, earnings_estimated: gananciaEstimada }), {
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

// Endpoints para llamadas individuales (client_calls)
export async function onRequestPostCall(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const tarifa = 0.10;
    const callMinutes = parseFloat(body.call_minutes) || 0;
    const earnings = callMinutes * tarifa;
    
    await env.DB.prepare(
      `INSERT INTO client_calls (client_id, call_type, call_date, call_time, call_minutes, earnings) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(body.client_id, body.call_type, body.call_date, body.call_time, callMinutes, earnings).run();
    
    return new Response(JSON.stringify({ success: true, earnings: earnings }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestGetCalls(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  
  try {
    let query = "SELECT * FROM client_calls ORDER BY call_date DESC, call_time DESC LIMIT 500";
    let params = [];
    if (start && end) {
      query = "SELECT * FROM client_calls WHERE call_date >= ? AND call_date <= ? ORDER BY call_date ASC, call_time ASC";
      params = [start, end];
    }
    const { results } = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Error en GET /api/calls:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, 
      headers: { "Content-Type": "application/json" }
    });
  }
}
