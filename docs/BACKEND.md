# Контракт с бэкендом (volshebny-bot, стейдж 02.09.2026)

Бэкенд живёт в репо `volshebny-bot`, полный контракт — его
`docs/FUNNEL_TG_BOT.md`. Здесь — краткая выжимка + план интеграции
фронта. Воронка в реестре бэка: `tg_bot` (совпадает с нашим
super property `funnel`).

## Ручки бэка

| ручка | что даёт | статус на фронте |
|---|---|---|
| `GET /onboard/offers?funnel=tg_bot` | цены тарифа (49 ₽/3 дня → 599 ₽/нед) | TODO: сейчас хардкод `PRICES` в data.ts |
| `POST /onboard/checkout` | продажа через bePaid; в ответе `appUrl` (app.volshebny.by/?scenario=…) | TODO: заменить мок в `useFunnel.pay()` |
| `GET /onboard/tg/deeplink` | диплинк бота-дожима | TODO: сейчас `TG_LINK` (канал) в data.ts |
| `GET /onboard/social-proof?funnel=tg_bot` | реальные счётчики (кеш 5 мин); **любое поле может быть null → блок скрывать**, не подставлять константу | TODO: сейчас константы `counter` в data.ts |
| `GET /r/<код>` | короткие ссылки постов → воронка с utm | готово: utm сами едут в события |

Активация доступа — вебхук bePaid (как у остальных воронок); отмена —
`POST /subscription/cancel` + экран подписки в приложении.
`?scenario=` в приложении открывает подборку
(FunnelScenarioLanding → `GET /onboard/scenario` → `/create/magic-photo?filter=<id>`).

Серверные события PostHog: `purchase_success` / `purchase_failed` шлёт
вебхук подписки (posthog-node; повторные доставки дублей не плодят).
Имена отличаются от клиентских `tg_payment_*` намеренно.

## Дожимы бота

`tgFunnelBotService`: ровно два дожима (30 мин и 24 ч) по крону,
таблица `funnel_bot_leads`, рубильник `TG_FUNNEL_BOT_NUDGE_ENABLED`.
Внимание: у Telegram один вебхук на бота, `TELEGRAM_BOT_TOKEN` занят
диплинк-логином — нужен отдельный `TG_FUNNEL_BOT_TOKEN` либо пересылка
апдейтов с `x-bot-secret` (иначе сломается вход в приложение).

## Что фронт должен дополнительно передать (согласовано в переписке)

- В `POST /onboard/checkout`: `distinct_id` (= `posthog.get_distinct_id()`)
  и `$session_id` — чтобы серверные purchase-события склеились с
  клиентской воронкой; плюс `scenario`, `utm_*`.
- `pain` больше НЕ существует (флоу v2 без квиза) — в серверных событиях
  поле отсутствует/nullable.

## Открытые вопросы (не решаются кодом)

- Формат return/fail URL возврата из bePaid → как фронту понять
  «успех/отказ» (ждём в контракте; без `TG_FUNNEL_URL` в env бэка
  возврат уедет на несуществующий адрес — WARN в логах).
- Юр. формулировка подписки.
- Цена даунселла 39 ₽: нужен план с `isOnboardPlan` в админке, иначе
  скидка молча откатится на основной оффер. На фронте флаг
  `INTERCEPT_DISCOUNT` выключен до появления плана.
- Точный маппинг «сценарий ↔ подборка» (ключи фронта:
  `dating | social | work | self`).

## Перед деплоем бэка (из его сообщения)

`npm run migrate` + env: `TG_FUNNEL_URL`, `POSTHOG_API_KEY`,
`TG_FUNNEL_BOT_*` (полный список — в `docs/FUNNEL_TG_BOT.md` бэка).
