"use client";

// Экран 1 — вау-эффект (правка заказчика 03.09): без большой пары
// сверху — сразу плитка до/после по всем сценариям, сценарий из
// ссылки поста первым. Надпись про промокод — у нижней CTA.

import { PRICES, SCENARIO_DATA } from "@/lib/funnel/data";
import { SCENARIOS, type Scenario } from "@/lib/funnel/types";

export default function WowScreen({
  scenario,
  onCta,
}: {
  scenario: Scenario;
  onCta: (placement: "top" | "bottom") => void;
}) {
  const d = SCENARIO_DATA[scenario];
  const ordered = [scenario, ...SCENARIOS.filter((k) => k !== scenario)];

  return (
    <div className="screen">
      <h1 className="h1" style={{ marginBottom: 8 }}>
        {d.wowHeadline}
      </h1>
      <p className="sub" style={{ marginBottom: 16 }}>
        Нейросеть делает это за минуту из одного селфи. Без фотографа,
        студии и обработки.
      </p>

      <button className="cta" onClick={() => onCta("top")}>
        Хочу так же — за {PRICES.trial} р.
      </button>

      <div className="wow-more">
        {ordered.map((k, i) => {
          const o = SCENARIO_DATA[k];
          return (
            <div key={k} className="wow-pair">
              <div className="wow-pair__label">{o.label}</div>
              <div className="ba-grid" style={{ marginBottom: 0 }}>
                <div className="ba-cell ba-cell--small">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.img.before}
                    alt={`До: ${o.beforeAlt}`}
                    {...(i === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
                  />
                  <div className="ba-badge ba-badge--before">ДО</div>
                </div>
                <div className="ba-cell ba-cell--small">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.img.after}
                    alt={`После: ${o.afterAlt}`}
                    {...(i === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
                  />
                  <div className="ba-badge ba-badge--after">ПОСЛЕ</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="cta" onClick={() => onCta("bottom")}>
        Хочу так же — за {PRICES.trial} р.
      </button>
      <p className="wow-note">
        По промокоду из поста · 3 дня полного доступа
      </p>
      <p className="footnote" style={{ marginTop: 0, paddingTop: 8 }}>
        Фото загрузите в приложении после активации — прямо с телефона
      </p>
    </div>
  );
}
