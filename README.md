# volshebny-tg-funnel

Веб-воронка из Telegram-бота/канала для volshebny.by, флоу v2 (по правке
заказчика 02.09.2026): вау-экран до/после → пейволл с таймером промокода →
оплата → редирект в приложение. Персонализация — через `?scenario=` в
ссылке поста (dating|social|work|self), без квиза.

## Поток

```
пост в боте/канале
  → /start?scenario=…&utm_source=tg&utm_campaign=[пост]
  → Экран 1 «Вау»: большое до/после под сценарий + примеры остальных
  → Экран 2 «Пейволл»: личный таймер промокода (15 мин, переживает
    перезагрузку) + оффер 49 р./3 дня + отзывы + FAQ
  → оплата (пока мок) → Экран успеха → app.volshebny.by?scenario=…
```

Ветка ухода: back браузера или «←» на пейволле → bottom sheet перехвата
(«Забрать за 49 р.» / «Прислать ссылку в Телеграм»).

Повторный заход того, кто уже видел пейволл, — сразу пейволл с плашкой
«Цена сохранена для вас»; таймер продолжается, не сбрасывается.

## Запуск

```bash
npm run dev        # http://localhost:3003
npm run build && npm run typecheck
```

Дев-хелпер: `?step=wow|paywall|success` открывает экран напрямую
(только не в production-сборке). `?scenario=` задаёт сценарий.

## Структура

- `app/start/page.tsx` — точка входа (статика), `app/page.tsx` — редирект `/` → `/start`
- `components/Funnel.tsx` — переключение экранов (SPA, без роутинга — переходы мгновенные)
- `lib/funnel/useFunnel.ts` — состояние: шаг, сценарий, таймер, перехват, мок-оплата
- `lib/funnel/data.ts` — весь контент: сценарии, отзывы, FAQ, цены, картинки
- `lib/analytics.ts` — PostHog (события `tg_*`, no-op без ключа)
- `app/globals.css` — дизайн-токены из хендоффа

## Состояние и аналитика

`scenario` приходит из ссылки поста, живёт в URL и localStorage
(`vf_scenario`); дедлайн таймера — `vf_deal_until`; utm-метки и scenario
едут super properties во все события (funnel = `tg_bot`).

События: `tg_wow_view` → `tg_wow_cta_click` → `tg_paywall_view` →
`tg_pay_click` → `tg_payment_form_open` → `tg_payment_success`; плюс
`tg_intercept_view|stay|tg_link`, `tg_return_visit`, `tg_timer_expired`,
`tg_app_redirect`. Ориентир из ТЗ: пейволл→оплата 5–15%.

## Инварианты React (грабли прошлых воронок)

- Никаких побочных эффектов в setState-апдейтерах (StrictMode зовёт дважды).
- Гарды от двойного тапа — только `ref`, state-гарды не работают в одном тике.
- Перехват back: `pushState` расширяет `history.state` и передаёт URL явно —
  иначе Next App Router теряет свой стейт и query-параметры.

## TODO(backend)

- Реальная платёжка с автопродлением (мок в `useFunnel.pay`) + автоактивация
  доступа после оплаты.
- Deeplink «Прислать ссылку в Телеграм» → бот с дожимом (`TG_LINK` в data.ts).
- Счётчики соцдоказательств — из реальной статистики (`counter` в data.ts).
- Картинки — примеры из Higgsfield, заменить продакшн-ассетами.
- А/Б-флаг: `INTERCEPT_DISCOUNT` (InterceptSheet.tsx, скидка 39 р. только
  на перехвате). Таймер промокода включён всегда (`PromoTimer.tsx`,
  `PROMO_MINUTES` в data.ts).
