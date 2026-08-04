export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    if (!body.month_id) throw new Error("Falta month_id");

    const amount = parseFloat(body.amount_received) || 0;
    const paymentDate = body.payment_date || new Date().toISOString().split('T')[0];

    const info = await env.DB.prepare(`
      INSERT INTO payments (month_id, amount_received, payment_date)
      VALUES (?, ?, ?)
      ON CONFLICT(month_id) DO UPDATE SET
        amount_received = excluded.amount_received,
        payment_date = excluded.payment_date
    `).bind(body.month_id, amount, paymentDate).run();

    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e) {
    console.error("Error en POST /api/payments:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get('month');

  try {
    if (!month) {
      return new Response(JSON.stringify(null), { 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const result = await env.DB.prepare(
      "SELECT * FROM payments WHERE month_id = ?"
    ).bind(month).first();

    return new Response(JSON.stringify(result || null), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e) {
    console.error("Error en GET /api/payments:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
