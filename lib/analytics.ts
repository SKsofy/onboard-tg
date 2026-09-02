"use client";

// ═════════════════════════════════════════════════════════════
//  PostHog — вся аналитика воронки в одном файле.
//
//  Ключ: NEXT_PUBLIC_POSTHOG_KEY (+ NEXT_PUBLIC_POSTHOG_HOST,
//  по умолчанию https://us.i.posthog.com). Без ключа — все вызовы
//  no-op: локальная разработка не падает и не мусорит в проде.
//
//  Имя воронки: funnel = "tg_bot" («Из бота ТГ») — super property,
//  едет со ВСЕМИ событиями, включая $autocapture. Ответы квиза
//  (scenario, pain) тоже регистрируются super properties — так
//  autocapture-клики и pageview сегментируются по ним без джойнов.
//
//  События по шагам ТЗ (все едут с scenario, pain, utm_*):
//   1. клик по ссылке из поста — на стороне канала, не здесь
//   2. tg_q1_view          — загрузка экрана 1
//   3. tg_q1_answer        — ответ на вопрос 1
//   4. tg_q2_answer        — ответ на вопрос 2
//   5. tg_paywall_view     — показ пейволла
//   6. tg_pay_click        — клик по кнопке оплаты
//   7. tg_payment_form_open— открытие формы оплаты (пока мок)
//   8. tg_payment_success  — успешная оплата (пока мок)
//   9–10 (вход в приложение, первая генерация) — на стороне app.
//  Плюс перехват: tg_intercept_view / tg_intercept_stay /
//  tg_intercept_tg_link, и tg_quiz_skipped при возврате с
//  сохранёнными ответами.
// ═════════════════════════════════════════════════════════════

import posthog from "posthog-js";
import type { Pain, Scenario, Step } from "./funnel/types";
import { STEP_INDEX } from "./funnel/types";

let inited = false;
let sessionStart = 0;
/** Дедупликация one-shot событий (view экранов). */
const fired = new Set<string>();

/** utm-метки текущего касания — не должны переживать смену кампании. */
const TOUCH_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

function urlProps(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of TOUCH_KEYS) {
    const v = q.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function initAnalytics(): void {
  if (inited || typeof window === "undefined") return;
  inited = true;
  sessionStart = Date.now();

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // no-op режим

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
    },
  });

  // Super properties: воронка + utm со всеми событиями.
  const touch = urlProps();
  posthog.register({ funnel: "tg_bot", ...touch });
  // Метки, которых нет в этом заходе, снимаем — иначе переживут кампанию.
  for (const k of TOUCH_KEYS) {
    if (!touch[k]) posthog.unregister(k);
  }
}

interface Ctx {
  scenario?: Scenario | null;
  pain?: Pain | null;
  [k: string]: unknown;
}

function capture(event: string, props: Ctx = {}): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, {
    ...props,
    time_since_start_ms: sessionStart ? Date.now() - sessionStart : undefined,
  });
}

/**
 * Ответы квиза → super properties: scenario/pain поедут со всеми
 * последующими событиями, включая $autocapture («куда тыкают»).
 * При сбросе ответа зовём с null — метка снимается.
 */
export function registerAnswers(props: {
  scenario?: Scenario | null;
  pain?: Pain | null;
}): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  const set: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v) set[k] = v;
    else if (v === null) posthog.unregister(k);
  }
  if (Object.keys(set).length) posthog.register(set);
}

/** One-shot: view экранов шлём один раз за сессию. */
function captureOnce(event: string, props: Ctx = {}): void {
  if (fired.has(event)) return;
  fired.add(event);
  capture(event, props);
}

export function trackStepView(step: Step, ctx: Ctx): void {
  captureOnce(`tg_${step}_view`, { ...ctx, step_index: STEP_INDEX[step] });
}

export function trackQ1Answer(scenario: Scenario): void {
  capture("tg_q1_answer", { scenario, step_index: STEP_INDEX.q1 });
}

export function trackQ2Answer(scenario: Scenario, pain: Pain): void {
  capture("tg_q2_answer", { scenario, pain, step_index: STEP_INDEX.q2 });
}

export function trackQuizSkipped(ctx: Ctx): void {
  captureOnce("tg_quiz_skipped", ctx);
}

export function trackPayClick(ctx: Ctx & { placement: "top" | "bottom" | "intercept" }): void {
  capture("tg_pay_click", ctx);
}

export function trackPaymentFormOpen(ctx: Ctx): void {
  capture("tg_payment_form_open", ctx);
}

export function trackPaymentSuccess(ctx: Ctx): void {
  capture("tg_payment_success", ctx);
}

/** TODO(backend): звать из колбэка платёжки при отказе/ошибке. */
export function trackPaymentFailed(ctx: Ctx & { reason?: string }): void {
  capture("tg_payment_failed", ctx);
}

export function trackIntercept(
  action: "view" | "stay" | "tg_link",
  ctx: Ctx
): void {
  capture(`tg_intercept_${action}`, ctx);
}

export function trackAppRedirect(ctx: Ctx): void {
  capture("tg_app_redirect", ctx);
}
