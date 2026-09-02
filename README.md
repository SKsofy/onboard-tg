# volshebny-tg-funnel

Веб-воронка из Telegram-канала для volshebny.by: квиз из 2 вопросов →
лоадер «собираем план» → персонализированный пейволл → оплата → редирект
в приложение. Свёрстана из хендоффа `Интерактивный прототип воронки.zip`
(Claude Design, 02.09.2026).

## Поток

```
пост в канале
  → /start?utm_source=tg&utm_medium=channel&utm_campaign=[пост]
  → Экран 1: сценарий (dating|social|work|self) — тап сразу ведёт дальше
  → Экран 2: боль (p1–p4), H1 зависит от сценария
  → Лоадер 2.4 с (3 чекпоинта по 600 мс)
  → Пейволл (хедлайн/до-после/отзывы/счётчик — под сценарий)
  → оплата (пока мок) → Экран успеха → app.volshebny.by?scenario=…
```

Ветка ухода: back браузера или «←» на пейволле → bottom sheet перехвата
(«Забрать за 49 р.» / «Прислать ссылку в Телеграм»).

Повторный заход с сохранёнными ответами: квиз пропускается, сразу пейволл
с плашкой «Ваш план сохранён».

## Запуск

```bash
npm run dev        # http://localhost:3003
npm run build && npm run typecheck
```

Дев-хелпер: `?step=q1|q2|loader|paywall|success` открывает экран напрямую
(только не в production-сборке). `?scenario=&pain=` подставляют ответы.

## Структура

- `app/start/page.tsx` — точка входа (статика), `app/page.tsx` — редирект `/` → `/start`
- `components/Funnel.tsx` — переключение экранов (SPA, без роутинга — переходы мгновенные)
- `lib/funnel/useFunnel.ts` — состояние: шаг, ответы, перехват, мок-оплата
- `lib/funnel/data.ts` — весь контент: сценарии, боли, отзывы, FAQ, цены, картинки CDN
- `lib/analytics.ts` — PostHog (события `tg_*`, no-op без ключа)
- `app/globals.css` — дизайн-токены из хендоффа

## Состояние и аналитика

`scenario`/`pain` живут в URL (`?scenario=&pain=`) и localStorage
(`vf_scenario`/`vf_pain`); utm-метки едут super properties во все события.

События: `tg_q1_view` → `tg_q1_answer` → `tg_q2_answer` → `tg_paywall_view`
→ `tg_pay_click` → `tg_payment_form_open` → `tg_payment_success`; плюс
`tg_intercept_view|stay|tg_link`, `tg_quiz_skipped`, `tg_app_redirect`.
Ориентиры из ТЗ: квиз проходят 70–85%, пейволл→оплата 5–15%.

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
- Картинки CDN — примеры из Higgsfield, заменить продакшн-ассетами.
- Опции А/Б: `SHOW_TIMER` (Paywall.tsx, только при реальном промокоде),
  `INTERCEPT_DISCOUNT` (InterceptSheet.tsx, скидка 39 р. только на перехвате).
