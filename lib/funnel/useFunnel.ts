"use client";

// ═════════════════════════════════════════════════════════════
//  Состояние воронки v2: вау → пейволл (таймер) → оплата → успех.
//
//  Инварианты (грабли из прошлых воронок, см. README):
//   · никаких побочных эффектов внутри setState-апдейтеров
//     (StrictMode вызывает их дважды);
//   · защита от двойного тапа — ТОЛЬКО ref-гарды, не state;
//   · pushState расширяет history.state и передаёт URL явно —
//     иначе Next App Router теряет стейт и query-параметры.
//
//  Сценарий приходит из ссылки поста (?scenario=), сохраняется в
//  localStorage. Повторный заход того, кто уже дошёл до пейволла, —
//  сразу пейволл + плашка «цена сохранена».
//
//  Таймер промокода: личный дедлайн (now + PROMO_MINUTES) пишется
//  в localStorage при первом показе пейволла и переживает
//  перезагрузку — это честный персональный резерв цены, а не
//  фейковый сброс на каждый заход.
// ═════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initAnalytics,
  registerScenario,
  trackAppRedirect,
  trackIntercept,
  trackPayClick,
  trackPaymentFormOpen,
  trackPaymentSuccess,
  trackReturnVisit,
  trackStepView,
  trackTimerExpired,
  trackWowCta,
} from "../analytics";
import { appUrl, PROMO_MINUTES } from "./data";
import type { Scenario, Step } from "./types";
import { isScenario } from "./types";

const LS_SCENARIO = "vf_scenario";
const LS_PAYWALL_SEEN = "vf_paywall_seen";
const LS_DEADLINE = "vf_deal_until"; // личный дедлайн промокода, ms epoch

const MOCK_PAY_MS = 700; // имитация платёжной формы

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/** Дописываем сценарий в URL, не трогая utm и не создавая навигацию. */
function urlSet(key: string, value: string): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {}
}

export interface FunnelState {
  step: Step;
  scenario: Scenario;
  /** Пользователь уже был на пейволле → плашка «цена сохранена». */
  saved: boolean;
  intercept: boolean;
  paying: boolean;
  /** Личный дедлайн промокода (ms epoch); 0 — ещё не назначен. */
  deadline: number;
}

export function useFunnel() {
  const [s, setS] = useState<FunnelState>({
    step: "wow",
    scenario: "dating",
    saved: false,
    intercept: false,
    paying: false,
    deadline: 0,
  });

  const payingRef = useRef(false); // ref-гард от двойного тапа по оплате
  const restoredRef = useRef(false); // init-эффект должен отработать один раз

  // ── Инициализация: аналитика + сценарий из ссылки + возврат ──
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    initAnalytics();

    const q = new URLSearchParams(window.location.search);
    const urlScenario = q.get("scenario");
    const stored = lsGet(LS_SCENARIO);
    const scenario: Scenario = isScenario(urlScenario)
      ? urlScenario
      : isScenario(stored)
        ? stored
        : "dating";
    lsSet(LS_SCENARIO, scenario);
    registerScenario(scenario);

    const deadline = Number(lsGet(LS_DEADLINE)) || 0;

    // Дев-хелпер: ?step=<name> открывает экран напрямую.
    const devStep = q.get("step") as Step | null;
    if (
      process.env.NODE_ENV !== "production" &&
      devStep &&
      ["wow", "paywall", "success"].includes(devStep)
    ) {
      setS((p) => ({ ...p, step: devStep, scenario, deadline }));
      return;
    }

    if (lsGet(LS_PAYWALL_SEEN) === "1") {
      // Повторный заход: вау уже видел — сразу на пейволл.
      setS((p) => ({ ...p, scenario, step: "paywall", saved: true, deadline }));
      trackReturnVisit({ scenario });
    } else {
      setS((p) => ({ ...p, scenario, deadline }));
    }
  }, []);

  // ── View-события при смене шага ──
  useEffect(() => {
    trackStepView(s.step, { scenario: s.scenario });
  }, [s.step, s.scenario]);

  // ── Пейволл: назначаем личный дедлайн промокода при первом показе ──
  useEffect(() => {
    if (s.step !== "paywall") return;
    lsSet(LS_PAYWALL_SEEN, "1");
    if (!s.deadline) {
      const d = Date.now() + PROMO_MINUTES * 60_000;
      lsSet(LS_DEADLINE, String(d));
      setS((p) => (p.deadline ? p : { ...p, deadline: d }));
    }
  }, [s.step, s.deadline]);

  // ── Перехват ухода: кнопка «назад» браузера на пейволле ──
  const stepRef = useRef(s.step);
  stepRef.current = s.step;
  useEffect(() => {
    if (s.step !== "paywall") return;
    const push = () =>
      window.history.pushState(
        { ...window.history.state, vfPaywall: true },
        "",
        window.location.href
      );
    push();
    const onPop = () => {
      if (stepRef.current !== "paywall") return;
      push();
      setS((p) => {
        if (p.intercept) return p; // второй back при открытом шите
        return { ...p, intercept: true };
      });
      trackIntercept("view", {});
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [s.step]);

  // ── Действия ──

  const goToPaywall = useCallback(
    (placement: "top" | "bottom") => {
      trackWowCta({ scenario: s.scenario, placement });
      setS((p) => ({ ...p, step: "paywall" }));
    },
    [s.scenario]
  );

  const openIntercept = useCallback(() => {
    trackIntercept("view", { scenario: s.scenario });
    setS((p) => ({ ...p, intercept: true }));
  }, [s.scenario]);

  const closeIntercept = useCallback(
    (reason: "stay" | "tg_link") => {
      trackIntercept(reason, { scenario: s.scenario });
      setS((p) => ({ ...p, intercept: false }));
    },
    [s.scenario]
  );

  const onTimerExpired = useCallback(() => {
    trackTimerExpired({ scenario: s.scenario });
  }, [s.scenario]);

  const pay = useCallback(
    (placement: "top" | "bottom" | "intercept") => {
      if (payingRef.current) return;
      payingRef.current = true;
      const ctx = { scenario: s.scenario };
      trackPayClick({ ...ctx, placement });
      setS((p) => ({ ...p, paying: true, intercept: false }));

      // TODO(backend): здесь открывается реальная платёжная форма
      // (виджет провайдера) с автопродлением. После success-колбэка —
      // автоактивация доступа на бэке и переход на экран успеха;
      // при отказе — trackPaymentFailed({reason}) и остаёмся тут.
      // Пока — мок: форма «открылась» и «оплатилась» сама.
      trackPaymentFormOpen(ctx);
      setTimeout(() => {
        trackPaymentSuccess(ctx);
        payingRef.current = false;
        setS((p) => ({ ...p, paying: false, step: "success" }));
      }, MOCK_PAY_MS);
    },
    [s.scenario]
  );

  const goToApp = useCallback(() => {
    trackAppRedirect({ scenario: s.scenario });
    window.location.href = appUrl(s.scenario);
  }, [s.scenario]);

  return {
    ...s,
    goToPaywall,
    openIntercept,
    closeIntercept,
    onTimerExpired,
    pay,
    goToApp,
  };
}
