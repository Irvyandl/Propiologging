export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    // UPSERT para pagos. Usamos tus columnas: payments (month_id, amount_received, payment_date)
    // Asumimos que month_id es único (ej: "2026-08")
    const info = await env.DB.prepare(`
      INSERT INTO payments (month_id, amount_received, payment_date)
      VALUES (?, ?, ?)
      ON CONFLICT(month_id) DO UPDATE SET
        amount_received = excluded.amount_received,
        payment_date = excluded.payment_date
    `).bind(body.month_id, body.amount_received, body.payment_date).run();

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get('month'); // ej: "2026-08"

  try {
    const result = await env.DB.prepare("SELECT * FROM payments WHERE month_id = ?").bind(month).first();
    return new Response(JSON.stringify(result || null), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
