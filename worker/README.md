# Подключение онлайн-оплаты ЮKassa

Серверная часть (`yookassa-worker.js`) нужна, чтобы секретный ключ ЮKassa
не лежал в коде сайта. Ставится на Cloudflare Workers — бесплатно.

## Шаг 1. Получить данные в ЮKassa
1. Зарегистрируйся на **yookassa.ru** (нужно ИП или ООО), пройди модерацию.
2. В кабинете → «Интеграция» → возьми:
   - **shopId** (идентификатор магазина)
   - **Секретный ключ** (Secret key)

## Шаг 2. Создать Worker
1. Зайди на **dash.cloudflare.com** → Workers & Pages → Create → Worker.
2. Назови, например, `nikolsky-pay`. Нажми Deploy (пока пустой).
3. Edit code → вставь содержимое файла `yookassa-worker.js` → Deploy.

## Шаг 3. Вписать переменные (Settings → Variables and Secrets)
| Имя | Тип | Значение |
|-----|-----|----------|
| `YOOKASSA_SHOP_ID` | Text | твой shopId |
| `YOOKASSA_SECRET_KEY` | **Secret** | твой секретный ключ ЮKassa |
| `TG_TOKEN` | Text | `7818572051:AAEoWoizhJybzlOgGmFmlJjrJ4A4AqQ2Lx0` |
| `TG_CHAT` | Text | `666070596` |
| `SITE_ORIGIN` | Text | `https://nikolskymed.ru` |
| `VAT_CODE` | Text | `1` (без НДС; уточни свой режим) |

Секретный ключ добавляй как **Secret** (Encrypt) — он не будет виден.

## Шаг 4. Включить вебхук в ЮKassa
В кабинете ЮKassa → «Интеграция» → HTTP-уведомления:
- URL: `https://nikolsky-pay.ТВОЙ-ЛОГИН.workers.dev/webhook`
- Событие: `payment.succeeded`

## Шаг 5. Включить оплату на сайте
Пришли мне адрес воркера (вида `https://nikolsky-pay.ТВОЙ-ЛОГИН.workers.dev`) —
я впишу его в `script.js` (`PAY_WORKER_URL`), и оплата заработает.

## Как это работает
1. Клиент в корзине выбирает «Онлайн» и оформляет заказ.
2. Сайт → Worker `/create` → ЮKassa создаёт платёж → клиент переходит на оплату.
3. Клиент платит картой/СБП на странице ЮKassa.
4. ЮKassa → Worker `/webhook` → в Telegram падает «✅ ОПЛАЧЕН заказ».
