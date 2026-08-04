// functions/api/payments.js

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { month_id, amount_received, payment_date } = body;

    // Lógica UPSERT manual para pagos
    const update = await env.DB.prepare(`
      UPDATE payments 
      SET amount_received = ?, payment_date = ?
      WHERE month_id = ?
    `).bind(amount_received, payment_date, month_id).run();

    if (update.meta.changes === 0) {
      await env.DB.prepare(`
        INSERT INTO payments (month_id, amount_received, payment_date)
        VALUES (?, ?, ?)
      `).bind(month_id, amount_received, payment_date).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { env } = context;
  // Traer todos los pagos históricos
  const { results } = await env.DB.prepare("SELECT * FROM payments ORDER BY month_id DESC").all();
  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
}
