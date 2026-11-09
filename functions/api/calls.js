// Archivo: functions/api/calls.js

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const tarifa = 0.10;
        const callMinutes = parseFloat(body.call_minutes) || 0;
        const earnings = callMinutes * tarifa;

        await env.DB.prepare(
            `INSERT INTO client_calls (client_id, call_type, call_date, call_time, call_minutes, earnings) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
            body.client_id, 
            body.call_type || null, 
            body.call_date, 
            body.call_time, 
            callMinutes, 
            earnings
        ).run();

        return new Response(JSON.stringify({ success: true, earnings: earnings }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        console.error("Error en POST /api/calls:", e.message);
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
