"use client";

import { SCENARIO_DATA } from "@/lib/funnel/data";
import { SCENARIOS, type Scenario } from "@/lib/funnel/types";

export default function Quiz1({
  onPick,
}: {
  onPick: (key: Scenario) => void;
}) {
  return (
    <div className="screen">
      <div className="progress">
        <div className="progress__bar progress__bar--on" />
        <div className="progress__bar" />
        <div className="progress__label">1 из 2</div>
      </div>
      <h1 className="h1" style={{ marginBottom: 8 }}>
        Для чего вам нужны крутые фото?
      </h1>
      <p className="sub" style={{ marginBottom: 20 }}>
        Два вопроса, и мы соберём подборку эффектов под вас
      </p>
      <div className="q1-grid">
        {SCENARIOS.map((key) => (
          <button key={key} className="q1-card" onClick={() => onPick(key)}>
            <div
              className="q1-card__img"
              style={{ backgroundImage: `url('${SCENARIO_DATA[key].img.q1}')` }}
            />
            <div className="q1-card__label">{SCENARIO_DATA[key].q1Label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
