"use client";

import { SCENARIO_DATA } from "@/lib/funnel/data";
import type { Scenario } from "@/lib/funnel/types";

export default function SuccessScreen({
  scenario,
  onGoToApp,
}: {
  scenario: Scenario;
  onGoToApp: () => void;
}) {
  return (
    <div className="screen success">
      <div className="success__badge">✓</div>
      <h1 className="success__title">Готово, доступ открыт на 3 дня</h1>
      <p className="success__text">
        Мы уже подобрали для вас 5 эффектов под сценарий «
        {SCENARIO_DATA[scenario].label}». Загрузите первое фото — результат
        будет через минуту.
      </p>
      <button className="cta" onClick={onGoToApp}>
        Загрузить первое фото
      </button>
    </div>
  );
}
