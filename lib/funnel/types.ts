// ═════════════════════════════════════════════════════════════
//  Типы воронки «volshebny.by/start» (бот/канал ТГ → пейволл).
//
//  Флоу v2 (правка заказчика 02.09.2026): без квиза.
//  Вау до/после → пейволл с таймером → оплата → успех.
//  Сценарий приходит из ссылки поста (?scenario=), не из квиза.
// ═════════════════════════════════════════════════════════════

export type Scenario = "dating" | "social" | "work" | "self";

export type Step =
  | "wow" // Экран 1 — вау-эффект до/после
  | "paywall" // Экран 2 — оффер + таймер + оплата
  | "success"; // Экран 3 — успех

// Порядок шагов для аналитики (step_index в событиях).
export const STEP_INDEX: Record<Step, number> = {
  wow: 1,
  paywall: 2,
  success: 3,
};

export const SCENARIOS: Scenario[] = ["dating", "social", "work", "self"];

export function isScenario(v: string | null): v is Scenario {
  return v !== null && (SCENARIOS as string[]).includes(v);
}
