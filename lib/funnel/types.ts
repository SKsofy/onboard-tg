// ═════════════════════════════════════════════════════════════
//  Типы воронки «volshebny.by/start» (Telegram-канал → пейволл).
// ═════════════════════════════════════════════════════════════

export type Scenario = "dating" | "social" | "work" | "self";
export type Pain = "p1" | "p2" | "p3" | "p4";

export type Step =
  | "q1" // Экран 1 — сегментация (вопрос 1)
  | "q2" // Экран 2 — боль (вопрос 2)
  | "loader" // «Собираем ваш план», 2.4 с
  | "paywall" // Пейволл (персонализация по scenario)
  | "success"; // Экран успеха после оплаты

// Порядок шагов для аналитики (step_index в событиях).
export const STEP_INDEX: Record<Step, number> = {
  q1: 1,
  q2: 2,
  loader: 3,
  paywall: 4,
  success: 5,
};

export const SCENARIOS: Scenario[] = ["dating", "social", "work", "self"];
export const PAINS: Pain[] = ["p1", "p2", "p3", "p4"];

export function isScenario(v: string | null): v is Scenario {
  return v !== null && (SCENARIOS as string[]).includes(v);
}
export function isPain(v: string | null): v is Pain {
  return v !== null && (PAINS as string[]).includes(v);
}
