"use client";

import { Q2_OPTIONS, SCENARIO_DATA } from "@/lib/funnel/data";
import type { Pain, Scenario } from "@/lib/funnel/types";

export default function Quiz2({
  scenario,
  onPick,
}: {
  scenario: Scenario;
  onPick: (key: Pain) => void;
}) {
  return (
    <div className="screen">
      <div className="progress">
        <div className="progress__bar progress__bar--on" />
        <div className="progress__bar progress__bar--on" />
        <div className="progress__label">2 из 2</div>
      </div>
      <h1 className="h1" style={{ marginBottom: 20 }}>
        {SCENARIO_DATA[scenario].q2Title}
      </h1>
      <div className="q2-list">
        {Q2_OPTIONS.map((o) => (
          <button key={o.key} className="q2-card" onClick={() => onPick(o.key)}>
            {o.label}
          </button>
        ))}
      </div>
      <p className="footnote">
        Мы не просим загружать фото — всё делается в приложении после активации
      </p>
    </div>
  );
}
