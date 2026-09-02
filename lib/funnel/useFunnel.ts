"use client";

// ═════════════════════════════════════════════════════════════
//  Состояние воронки: шаг, ответы, перехват, мок-оплата.
//
//  Инварианты (грабли из прошлых воронок, см. README):
//   · никаких побочных эффектов внутри setState-апдейтеров
//     (StrictMode вызывает их дважды);
//   · защита от двойного тапа — ТОЛЬКО ref-гарды, не state;
//   · флаг «состояние восстановлено» живёт в state.
//
//  Персистентность: scenario/pain в URL (?scenario=&pain=) и
//  localStorage (vf_scenario / vf_pain). Повторный заход с
//  сохранёнными ответами → сразу пейволл + плашка «сохранён».
// ═════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initAnalytics,
  trackAppRedirect,
  trackIntercept,
  trackPayClick,
  trackPaymentFormOpen,
  trackPaymentSuccess,
  trackQ1Answer,
  trackQ2Answer,
  trackQuizSkipped,
  trackStepView,
} from "../analytics";
import { appUrl, SCENARIO_DATA } from "./data";
import type { Pain, Scenario, Step } from "./types";
import { isPain, isScenario } from "./types";

const LS_SCENARIO = "vf_scenario";
const LS_PAIN = "vf_pain";

const LOADER_STEP_MS = 600; // шаг появления чекпоинтов
const LOADER_TOTAL_MS = 2400; // автопереход на пейволл (< 3 с по ТЗ)
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

/** Дописываем ответ в URL, не трогая utm и не создавая навигацию. */
function urlSet(key: string, value: string): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {}
}

export interface FunnelState {
  step: Step;
  scenario: Scenario | null;
  pain: Pain | null;
  /** Ответы восстановлены из прошлого визита → плашка «план сохранён». */
  saved: boolean;
  intercept: boolean;
  loaderN: number; // сколько чекпоинтов лоадера уже показано (0–3)
  paying: boolean;
}

export function useFunnel() {
  const [s, setS] = useState<FunnelState>({
    step: "q1",
    scenario: null,
    pain: null,
    saved: false,
    intercept: false,
    loaderN: 0,
    paying: false,
  });

  const payingRef = useRef(false); // ref-гард от двойного тапа по оплате
  const pickGuard = useRef(false); // ref-гард от двойного тапа по карточкам
  const restoredRef = useRef(false); // init-эффект должен отработать один раз

  // ── Инициализация: аналитика + восстановление ответов ──
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    initAnalytics();

    const q = new URLSearchParams(window.location.search);
    const urlScenario = q.get("scenario");
    const urlPain = q.get("pain");
    const scenario = isScenario(urlScenario)
      ? urlScenario
      : isScenario(lsGet(LS_SCENARIO))
        ? (lsGet(LS_SCENARIO) as Scenario)
        : null;
    const pain = isPain(urlPain)
      ? urlPain
      : isPain(lsGet(LS_PAIN))
        ? (lsGet(LS_PAIN) as Pain)
        : null;

    // Дев-хелпер: ?step=<name> открывает экран напрямую.
    const devStep = q.get("step") as Step | null;
    if (
      process.env.NODE_ENV !== "production" &&
      devStep &&
      ["q1", "q2", "loader", "paywall", "success"].includes(devStep)
    ) {
      setS((p) => ({ ...p, step: devStep, scenario, pain }));
      return;
    }

    if (scenario && pain) {
      // Повторный заход: квиз пропускаем, сразу пейволл.
      setS((p) => ({ ...p, scenario, pain, step: "paywall", saved: true }));
      trackQuizSkipped({ scenario, pain });
    } else if (scenario) {
      setS((p) => ({ ...p, scenario, step: "q2" }));
    }
  }, []);

  // ── View-события при смене шага ──
  useEffect(() => {
    trackStepView(s.step, { scenario: s.scenario, pain: s.pain });
  }, [s.step, s.scenario, s.pain]);

  // ── Лоадер: чекпоинты каждые 600 мс, автопереход через 2.4 с ──
  useEffect(() => {
    if (s.step !== "loader") return;
    const timers = [1, 2, 3].map((n) =>
      setTimeout(
        () => setS((p) => ({ ...p, loaderN: n })),
        n * LOADER_STEP_MS
      )
    );
    timers.push(
      setTimeout(() => {
        pickGuard.current = false;
        setS((p) => ({ ...p, step: "paywall" }));
      }, LOADER_TOTAL_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [s.step]);

  // ── Перехват ухода: кнопка «назад» браузера на пейволле ──
  // На входе в пейволл кладём state в историю; back → popstate →
  // показываем bottom sheet и возвращаем state, чтобы ловить и
  // следующий back. beforeunload во встроенном браузере TG не даёт
  // кастомного UI — ограничиваемся историей (как в ТЗ, best-effort).
  const stepRef = useRef(s.step);
  stepRef.current = s.step;
  useEffect(() => {
    if (s.step !== "paywall") return;
    // URL передаём явно (текущий href), state расширяем, а не заменяем —
    // иначе Next App Router теряет свой стейт истории и query-параметры.
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

  const pickScenario = useCallback((key: Scenario) => {
    if (pickGuard.current) return;
    pickGuard.current = true;
    lsSet(LS_SCENARIO, key);
    urlSet("scenario", key);
    // Греем «до/после» выбранного сценария: пока пользователь на
    // втором вопросе и лоадере (~3+ с), пейволл получит фото из кэша.
    for (const src of [SCENARIO_DATA[key].img.before, SCENARIO_DATA[key].img.after]) {
      const im = new Image();
      im.src = src;
    }
    trackQ1Answer(key);
    setS((p) => ({ ...p, scenario: key, step: "q2", saved: false }));
    // Разрешаем следующий тап после смены экрана.
    setTimeout(() => (pickGuard.current = false), 300);
  }, []);

  const pickPain = useCallback(
    (key: Pain) => {
      if (pickGuard.current) return;
      pickGuard.current = true;
      lsSet(LS_PAIN, key);
      urlSet("pain", key);
      trackQ2Answer(s.scenario ?? "dating", key);
      setS((p) => ({ ...p, pain: key, step: "loader", loaderN: 0 }));
      // pickGuard снимет переход loader → paywall
    },
    [s.scenario]
  );

  const openIntercept = useCallback(() => {
    trackIntercept("view", { scenario: s.scenario, pain: s.pain });
    setS((p) => ({ ...p, intercept: true }));
  }, [s.scenario, s.pain]);

  const closeIntercept = useCallback(
    (reason: "stay" | "tg_link") => {
      trackIntercept(reason, { scenario: s.scenario, pain: s.pain });
      setS((p) => ({ ...p, intercept: false }));
    },
    [s.scenario, s.pain]
  );

  const pay = useCallback(
    (placement: "top" | "bottom" | "intercept") => {
      if (payingRef.current) return;
      payingRef.current = true;
      const ctx = { scenario: s.scenario, pain: s.pain };
      trackPayClick({ ...ctx, placement });
      setS((p) => ({ ...p, paying: true, intercept: false }));

      // TODO(backend): здесь открывается реальная платёжная форма
      // (виджет провайдера) с автопродлением. После success-колбэка —
      // автоактивация доступа на бэке и переход на экран успеха.
      // Пока — мок: форма «открылась» и «оплатилась» сама.
      trackPaymentFormOpen(ctx);
      setTimeout(() => {
        trackPaymentSuccess(ctx);
        payingRef.current = false;
        setS((p) => ({ ...p, paying: false, step: "success" }));
      }, MOCK_PAY_MS);
    },
    [s.scenario, s.pain]
  );

  const goToApp = useCallback(() => {
    const scenario = s.scenario ?? "self";
    trackAppRedirect({ scenario, pain: s.pain });
    window.location.href = appUrl(scenario);
  }, [s.scenario, s.pain]);

  return {
    ...s,
    pickScenario,
    pickPain,
    openIntercept,
    closeIntercept,
    pay,
    goToApp,
  };
}
