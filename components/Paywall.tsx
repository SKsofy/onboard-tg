"use client";

import Faq from "./Faq";
import { offerItems, PRICES, SCENARIO_DATA } from "@/lib/funnel/data";
import type { Scenario } from "@/lib/funnel/types";

// Опциональный таймер — включать ТОЛЬКО при реальном ограничении
// промокода (иначе это фейк-дефицит, см. хендофф).
const SHOW_TIMER = false;

export default function Paywall({
  scenario,
  saved,
  paying,
  onBack,
  onPay,
}: {
  scenario: Scenario;
  saved: boolean;
  paying: boolean;
  onBack: () => void;
  onPay: (placement: "top" | "bottom") => void;
}) {
  const d = SCENARIO_DATA[scenario];
  const ctaLabel = paying
    ? "Открываем оплату…"
    : `Получить доступ за ${PRICES.trial} р.`;

  return (
    <div className="screen paywall">
      <div className="paywall__topbar">
        <button className="back-btn" onClick={onBack} aria-label="Назад">
          ←
        </button>
        {saved && <div className="saved-pill">Ваш план сохранён</div>}
      </div>

      {SHOW_TIMER && (
        <div className="timer-strip">
          Промокод из поста действует до среды · осталось 1 д 14 ч
        </div>
      )}

      <h1 className="paywall__headline">{d.headline}</h1>
      <p className="paywall__sub">
        Подобрали 5 эффектов под ваш запрос. Первый результат через минуту
        после загрузки фото — без фотографа и обработки.
      </p>

      <div className="ba-grid">
        <div className="ba-cell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.img.before} alt={`До: ${d.beforeAlt}`} />
          <div className="ba-badge ba-badge--before">ДО</div>
        </div>
        <div className="ba-cell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.img.after} alt={`После: ${d.afterAlt}`} />
          <div className="ba-badge ba-badge--after">ПОСЛЕ</div>
        </div>
      </div>

      <div className="offer">
        <div className="offer__price">
          3 дня полного доступа — {PRICES.trial} р.
        </div>
        <div className="offer__old">
          <s>обычная цена {PRICES.weekly} р. в неделю</s>
        </div>
        <div className="offer__list">
          {offerItems(scenario).map((t, i) => (
            <div key={i} className="offer__item">
              <span className="offer__check">✓</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="cta" onClick={() => onPay("top")} disabled={paying}>
        {ctaLabel}
      </button>
      {/* Дисклеймер про автопродление НЕ прятать — иначе рефанды и диспуты */}
      <p className="legal">
        Через 3 дня подписка продлится автоматически за {PRICES.weekly} р. в
        неделю. Отменить можно в один клик в приложении в любой момент.
      </p>

      <div className="reviews">
        {d.reviews.map((r, i) => (
          <div key={i} className="review">
            <div className="review__text">{r.text}</div>
            <div className="review__who">{r.who} · ★★★★★</div>
          </div>
        ))}
      </div>
      <div className="counter">{d.counter}</div>

      <Faq />

      <button className="cta" onClick={() => onPay("bottom")} disabled={paying}>
        {ctaLabel}
      </button>
    </div>
  );
}
