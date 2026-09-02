# Аналитика воронки «Из бота ТГ» (PostHog)

**Готовый дашборд: [Воронка из бота ТГ](https://us.posthog.com/project/552473/dashboard/2057569)**
(основная воронка, разбивка по сценариям, кнопки оплаты по placement,
перехват, оплаты по дням, таблица постов по utm_campaign).

Проект PostHog тот же, что у остальных воронок (`NEXT_PUBLIC_POSTHOG_KEY`
в `.env.local`). Всё в `lib/analytics.ts`. Эта воронка помечена super
property **`funnel = "tg_bot"`** — фильтруйте по нему любой отчёт, чтобы
не мешать с другими воронками проекта.

## Что едет с каждым событием

Super properties (регистрируются один раз, едут со ВСЕМИ событиями,
включая `$autocapture` и `$pageview`):

| property | значения | когда ставится |
|---|---|---|
| `funnel` | `tg_bot` | init |
| `utm_source` / `utm_medium` / `utm_campaign` / `utm_term` / `utm_content` | из URL | init; отсутствующие в заходе метки снимаются |
| `scenario` | `dating` \| `social` \| `work` \| `self` | из ссылки поста `?scenario=` (или восстановление) |

Плюс на каждом событии: `time_since_start_ms`, на view-событиях `step_index`.

## Реестр событий (в порядке воронки, флоу v2)

| # | событие | когда | важные props |
|---|---|---|---|
| 1 | *(клик по ссылке в боте/канале — на стороне ТГ, не здесь)* | | |
| 2 | `tg_wow_view` | загрузка вау-экрана до/после (one-shot) | `step_index=1` |
| 3 | `tg_wow_cta_click` | тап «Хочу так же» | `placement`: `top` \| `bottom` |
| 4 | `tg_paywall_view` | показ пейволла (one-shot) | `step_index=2` |
| 5 | `tg_pay_click` | тап по CTA оплаты | `placement`: `top` \| `bottom` \| `intercept` |
| 6 | `tg_payment_form_open` | открытие платёжной формы *(пока мок)* | |
| 7 | `tg_payment_success` | успешная оплата *(пока мок)* | |
| 7а | `tg_payment_failed` | отказ платёжки *(TODO(backend), звать из колбэка)* | `reason` |
| 8 | `tg_success_view` | экран успеха | |
| 9 | `tg_app_redirect` | тап «Загрузить первое фото» → app.volshebny.by | `scenario` |

Вне основной ветки:

| событие | когда |
|---|---|
| `tg_return_visit` | повторный заход видевшего пейволл (сразу пейволл, «цена сохранена») |
| `tg_timer_expired` | сгорел личный 15-мин таймер промокода (one-shot) |
| `tg_intercept_view` | показ шита перехвата (back браузера или «←») |
| `tg_intercept_stay` | «Забрать за 49 р.» — вернулся на пейволл |
| `tg_intercept_tg_link` | «Прислать ссылку в Телеграм» |

«Куда тыкают» без имён: `$autocapture` включён — каждый клик/тап уходит
сам, с `funnel`/`scenario`/`pain`/utm. Session replay включён
(поля ввода маскируются). Пришедшие из бота отличимы по `utm_source`.

## Как собрать воронку в PostHog

**Insights → New → Funnel**, фильтр `funnel = tg_bot`, шаги:

1. `tg_wow_view` → 2. `tg_wow_cta_click` → 3. `tg_paywall_view` →
4. `tg_pay_click` → 5. `tg_payment_success`

Breakdown по `scenario` — какой сегмент конвертит; по `utm_campaign` —
какой пост канала/бота приводит платящих.

Полезные разрезы:
- **Пейволл → оплата** по `placement` события `tg_pay_click`: верхняя
  кнопка vs нижняя vs после перехвата.
- **Перехват**: `tg_intercept_view` → `tg_intercept_stay` →
  `tg_pay_click` — сколько вернул шит.
- **Дожим в ТГ**: count `tg_intercept_tg_link` по `utm_campaign` —
  сколько народу забирает ссылку (передавать боту для сообщения-дожима).

## Ориентиры из ТЗ

- Пейволл → оплата 5–15% на тёплом трафике; меньше 3% — проблема в оффере.
- Вау → пейволл: следить за `tg_wow_cta_click` / `tg_wow_view` — если
  меньше ~40%, вау-экран не цепляет.

## Серверные события (TODO(backend))

По образцу genfunnel (`lib/server/analytics.ts`, posthog-node): при
реальной платёжке шлите `server_purchase_success|failed` с бэка —
клиентские события теряются на закрытой вкладке. `distinct_id` должен
совпадать с клиентским (см. когда появится идентификация).
