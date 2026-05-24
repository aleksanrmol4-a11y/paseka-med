/**
 * ЮKassa оплата для пасеки НИКОЛЬСКИЙ — Cloudflare Worker (серверная часть).
 *
 * Зачем нужен: секретный ключ ЮKassa НЕЛЬЗЯ держать в коде сайта.
 * Поэтому платёж создаётся здесь, на сервере, по защищённому ключу.
 *
 * ── Переменные окружения (Cloudflare → Worker → Settings → Variables) ──
 *   YOOKASSA_SHOP_ID    — shopId из личного кабинета ЮKassa
 *   YOOKASSA_SECRET_KEY — секретный ключ из ЮKassa (Secret, не показывать!)
 *   TG_TOKEN            — токен Telegram-бота (для уведомления об оплате)
 *   TG_CHAT             — chat_id, куда слать уведомления (напр. 666070596)
 *   SITE_ORIGIN         — https://nikolskymed.ru (для CORS и возврата после оплаты)
 *   VAT_CODE            — код НДС для чека: 1 = без НДС (по умолчанию 1)
 *
 * ── Роуты ──
 *   POST /create   — сайт просит создать платёж, в ответ { confirmation_url }
 *   POST /webhook  — ЮKassa присылает уведомление об оплате
 *
 * ── После деплоя ──
 *   1) Поставить URL вебхука в ЮKassa: <worker-url>/webhook (событие payment.succeeded)
 *   2) В script.js сайта вписать PAY_WORKER_URL = '<worker-url>'
 */

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

const json = (obj, status, headers) =>
  new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', ...(headers || {}) } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = env.SITE_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ───── Создание платежа ─────
    if (url.pathname === '/create' && request.method === 'POST') {
      try {
        const data = await request.json();
        const items = Array.isArray(data.items) ? data.items : [];
        if (!items.length) return json({ error: 'empty_cart' }, 400, corsHeaders(origin));

        const total = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
        if (!(total > 0)) return json({ error: 'bad_total' }, 400, corsHeaders(origin));

        const vat = Number(env.VAT_CODE || '1');
        const phone = String(data.phone || '').replace(/\D/g, '');

        const receiptItems = items.map(i => ({
          description: String(i.name + (i.unit ? ' (' + i.unit + ')' : '')).slice(0, 128),
          quantity: String(i.qty),
          amount: { value: Number(i.price).toFixed(2), currency: 'RUB' },
          vat_code: vat,
          payment_mode: 'full_payment',
          payment_subject: 'commodity',
        }));

        const payload = {
          amount: { value: total.toFixed(2), currency: 'RUB' },
          capture: true,
          confirmation: {
            type: 'redirect',
            return_url: (env.SITE_ORIGIN || 'https://nikolskymed.ru') + '/?paid=1',
          },
          description: 'Заказ мёда — Пасека НИКОЛЬСКИЙ',
          metadata: {
            phone: data.phone || '',
            delivery: data.delivery || '',
            comment: data.comment || '',
          },
          receipt: {
            customer: data.email ? { email: data.email } : { phone: phone },
            items: receiptItems,
          },
        };

        const auth = 'Basic ' + btoa(env.YOOKASSA_SHOP_ID + ':' + env.YOOKASSA_SECRET_KEY);
        const resp = await fetch('https://api.yookassa.ru/v3/payments', {
          method: 'POST',
          headers: {
            'Authorization': auth,
            'Idempotence-Key': crypto.randomUUID(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const payment = await resp.json();
        if (!resp.ok) return json({ error: 'yookassa_error', detail: payment }, 502, corsHeaders(origin));

        return json(
          { confirmation_url: payment.confirmation && payment.confirmation.confirmation_url, id: payment.id },
          200, corsHeaders(origin)
        );
      } catch (e) {
        return json({ error: String(e) }, 500, corsHeaders(origin));
      }
    }

    // ───── Вебхук от ЮKassa ─────
    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const note = await request.json();
        const obj = (note && note.object) || {};
        if (obj.id) {
          // перепроверяем статус напрямую у ЮKassa (защита от поддельных уведомлений)
          const auth = 'Basic ' + btoa(env.YOOKASSA_SHOP_ID + ':' + env.YOOKASSA_SECRET_KEY);
          const r = await fetch('https://api.yookassa.ru/v3/payments/' + obj.id, { headers: { 'Authorization': auth } });
          const p = await r.json();
          if (p && p.status === 'succeeded') {
            const m = p.metadata || {};
            const text =
              '✅ ОПЛАЧЕН заказ — Пасека НИКОЛЬСКИЙ\n' +
              'Сумма: ' + (p.amount ? p.amount.value : '') + ' ₽\n' +
              '📞 ' + (m.phone || '—') + '\n' +
              '🚚 ' + (m.delivery || '—') + '\n' +
              '💬 ' + (m.comment || '—') + '\n' +
              'ID: ' + p.id;
            if (env.TG_TOKEN && env.TG_CHAT) {
              await fetch('https://api.telegram.org/bot' + env.TG_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: env.TG_CHAT, text }),
              });
            }
          }
        }
        return new Response('ok', { status: 200 });
      } catch (e) {
        return new Response('ok', { status: 200 }); // всегда 200, чтобы ЮKassa не повторяла бесконечно
      }
    }

    return new Response('NIKOLSKY pay worker', { status: 200 });
  },
};
