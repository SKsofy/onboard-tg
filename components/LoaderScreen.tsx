"use client";

import { loaderChecks } from "@/lib/funnel/data";
import type { Scenario } from "@/lib/funnel/types";

export default function LoaderScreen({
  scenario,
  loaderN,
}: {
  scenario: Scenario;
  loaderN: number;
}) {
  const checks = loaderChecks(scenario);
  const pct = Math.min(100, Math.round((loaderN / 3) * 100));
  return (
    <div className="screen loader">
      <div className="loader__title">Собираем ваш план</div>
      <div className="loader__checks">
        {checks.map((label, i) => (
          <div
            key={i}
            className={
              "loader__check" + (loaderN > i ? " loader__check--on" : "")
            }
          >
            <div className="loader__dot">✓</div>
            <div className="loader__text">{label}</div>
          </div>
        ))}
      </div>
      <div className="loader__track">
        <div className="loader__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
