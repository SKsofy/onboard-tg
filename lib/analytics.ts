"use client";

// ═════════════════════════════════════════════════════════════
//  PostHog — вся аналитика воронки в одном файле.
//
//  Ключ: NEXT_PUBLIC_POSTHOG_KEY (+ NEXT_PUBLIC_POSTHOG_HOST,
//  по умолчанию https://us.i.posthog.com). Без ключа — все вызовы
//  no-op: локальная разработка не падает и не мусорит в проде.
//
//  Имя воронки: funnel = "tg_bot" («Из бота ТГ») — super property,
//  едет со ВСЕМИ событиями, включая $autocapture. Сценарий из
//  ссылки поста регистрируется super property — autocapture-клики
//  и pageview сегментируются по нему без джойнов.
//
//  События флоу v2 (вау → пейволл → оплата):
//   1. клик по ссылке из поста — на стороне бота/канала, не здесь
//   2. tg_wow_view          — загрузка вау-экрана до/после
//   3. tg_wow_cta_click     — клик «Хочу так же» (placement)
//   4. tg_paywall_view      — показ пейволла
//   5. tg_pay_click         — клик по кнопке оплаты (placement)
//   6. tg_payment_form_open — открытие формы оплаты (пока мок)
//   7. tg_payment_success   — успешная оплата (пока мок)
//   7а tg_payment_failed    — отказ (TODO(backend), из колбэка)
//   8. tg_success_view / tg_app_redirect — успех и уход в app.
//  Плюс: tg_intercept_view / stay / tg_link (перехват ухода),
//  tg_return_visit (повторный заход → сразу пейволл),
//  tg_timer_expired (сгорел личный таймер промокода).
// ═════════════════════════════════════════════════════════════

import posthog from "posthog-js";
import type { Scenario, Step } from "./funnel/types";
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
 * Сценарий из ссылки поста → super property: поедет со всеми
 * последующими событиями, включая $autocapture («куда тыкают»).
 */
export function registerScenario(scenario: Scenario | null): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (scenario) posthog.register({ scenario });
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

export function trackWowCta(ctx: Ctx & { placement: "top" | "bottom" }): void {
  capture("tg_wow_cta_click", { ...ctx, step_index: STEP_INDEX.wow });
}

export function trackReturnVisit(ctx: Ctx): void {
  captureOnce("tg_return_visit", ctx);
}

export function trackPayClick(
  ctx: Ctx & { placement: "top" | "bottom" | "intercept" }
): void {
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

export function trackTimerExpired(ctx: Ctx): void {
  captureOnce("tg_timer_expired", ctx);
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
